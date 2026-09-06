/**
 * @license
 * Copyright 2025 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'RecipeStepIngredientAmountsView',
  extends: 'foam.u2.View',

  documentation: `Property view for RecipeStep's 'ingredientAmounts' (*:* to
    IngredientAmount). Shows a plain table of the amounts on this step and, following
    the AlternativePickerView pattern, two ways to add one: a searchable dropdown to
    attach an existing IngredientAmount, and a button to create a brand-new one in
    place. We don't use the stock ManyToManyRelationshipPropertyView (its table caps
    rows and its add-existing action opens a full DAO picker).

    Search: an IngredientAmount's label (toSummary) is derived from the *referenced*
    Ingredient, so it isn't a stored field and the default reference chooser's keyword
    search can't match on it. We instead load the amounts into a client-side MDAO,
    populate each one's transient 'summary' from toSummary, and point a RichChoiceView
    at it with searchBy: [ IngredientAmount.SUMMARY ] — so typing filters on the
    readable summary in memory.

    The *:* junction stores the step's id, so amounts can only be linked once the step
    is persisted. To make this work in the create view too, we operate on the step
    object itself (reached via the detail view's exported 'objData'): when you add an
    amount to an unsaved step we save the step first — assigning its id in place so the
    surrounding create/Save flow just updates the same record — then create the
    junction. Bumping 'version' re-renders the table off the step's fresh relationship.`,

  requires: [
    'com.foamdev.cook.IngredientAmount',
    'foam.dao.MDAO',
    'foam.log.LogLevel',
    'foam.u2.dialog.Popup',
    'foam.u2.table.TableView',
    'foam.u2.view.RichChoiceView'
  ],

  imports: [
    'ingredientAmountDAO',
    'recipeStepDAO',
    'notify'
  ],

  properties: [
    {
      // Client-side, in-memory copy of the ingredient amounts with 'summary'
      // populated, so the dropdown can search on the readable label.
      name: 'searchDAO'
    },
    {
      class: 'Int',
      name: 'selectedAmountId',
      documentation: 'Scratch selection for the attach dropdown; reset to 0 after use.'
    },
    {
      class: 'Int',
      name: 'version',
      documentation: 'Bumped after attaching an amount to re-render the table.'
    }
  ],

  css: `
    ^ { display: flex; flex-direction: column; gap: 8px; align-items: stretch; }
    ^empty { color: #888; font-style: italic; }
    ^add-row { display: flex; align-items: center; gap: 8px; }
    ^popup { display: flex; flex-direction: column; gap: 12px; padding: 24px; min-width: 360px; }
    ^popup-title { font-size: 18px; font-weight: bold; }
    ^popup-actions { display: flex; gap: 8px; margin-top: 8px; }
    ^btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
    ^btn-primary { background: #0066cc; color: white; }
    ^btn-secondary { background: #666; color: white; }
  `,

  actions: [
    {
      name: 'newIngredientAmount',
      label: 'New ingredient amount',
      toolTip: 'Create a new ingredient amount and attach it to this step',
      code: function() { this.createIngredientAmount(); }
    }
  ],

  methods: [
    function init() {
      this.SUPER();
      this.loadSearchDAO();
    },

    async function loadSearchDAO() {
      var sink = await this.ingredientAmountDAO.select();
      var mdao = this.MDAO.create({ of: this.IngredientAmount });
      // toSummary is async (it resolves the referenced Ingredient); resolve each up
      // front into the transient 'summary' so the in-memory search can match on it.
      await Promise.all(sink.array.map(async ia => {
        ia.summary = await ia.toSummary();
        await mdao.put(ia);
      }));
      this.searchDAO = mdao;
    },

    function render() {
      this.SUPER();
      var self = this;

      // Attach an existing amount as soon as one is picked from the dropdown, then
      // reset the dropdown (which re-fires this listener with 0 — guarded below).
      this.onDetach(this.selectedAmountId$.sub(function() {
        if ( self.selectedAmountId ) self.attachExisting(self.selectedAmountId);
      }));

      this.addClass()
        .add(this.slot(function(version) {
          var e = self.E();
          // A *:* needs the step's id to scope its junction, so only show the table
          // once the step exists. A fresh step has no amounts anyway, and rendering
          // at id 0 would surface unrelated rows.
          var step = self.__context__.objData;
          if ( step && step.id ) {
            e.tag(self.TableView, {
              data: step.ingredientAmounts.dao,
              columns: [ 'amount', 'unit', 'ingredient' ]
            });
          } else {
            e.start().addClass(self.myClass('empty'))
              .add('No ingredient amounts yet.')
            .end();
          }
          return e;
        }))
        // Add existing (searchable dropdown) or create a new one in place — editable only.
        .callIf(this.mode === foam.u2.DisplayMode.RW, function() {
          this.start('div').addClass(self.myClass('add-row'))
            .startContext({ data: self })
              .add(self.slot(function(searchDAO) {
                if ( ! searchDAO ) return self.E();
                return self.E().tag(self.RichChoiceView, {
                  search: true,
                  searchPlaceholder: 'Search ingredient amounts',
                  sections: [ { dao: searchDAO, searchBy: [ self.IngredientAmount.SUMMARY ] } ],
                  data$: self.selectedAmountId$
                });
              }, self.searchDAO$))
              .add(self.NEW_INGREDIENT_AMOUNT)
            .endContext()
          .end();
        });
    },

    // Persist the step if it hasn't been yet, adopting the assigned id in place so
    // the surrounding create/Save flow just updates this same record. Returns the
    // step, now guaranteed to have an id the junction can reference.
    async function ensureStepSaved(step) {
      if ( ! step.id ) {
        var saved = await this.recipeStepDAO.put(step);
        step.id = saved.id;
      }
      return step;
    },

    async function attachExisting(id) {
      var step = this.__context__.objData;
      if ( ! step ) {
        this.notify('Could not resolve the recipe step.', '', this.LogLevel.ERROR);
        return;
      }
      var ia = await this.ingredientAmountDAO.find(id);
      this.selectedAmountId = 0;   // reset the dropdown for the next pick
      if ( ! ia ) return;

      await this.ensureStepSaved(step);
      await step.ingredientAmounts.add(ia);
      this.version++;
    },

    function createIngredientAmount() {
      var self = this;
      var step = this.__context__.objData;
      if ( ! step ) {
        this.notify('Could not resolve the recipe step.', '', this.LogLevel.ERROR);
        return;
      }

      var draft = this.IngredientAmount.create({}, this);
      var popup = this.Popup.create({}, this);

      popup
        .start().addClass(this.myClass('popup'))
          .start().addClass(this.myClass('popup-title')).add('New Ingredient Amount').end()
          // Reuse IngredientAmount's own 'main' section form (amount / unit /
          // ingredient), which brings the ingredient picker + validation along for free.
          .startContext({ data: draft })
            .tag({
              class: 'foam.u2.detail.VerticalDetailView',
              data: draft,
              useSections: [ 'main' ]
            })
          .endContext()
          .start().addClass(this.myClass('popup-actions'))
            .start('button')
              .addClass(this.myClass('btn')).addClass(this.myClass('btn-primary'))
              .add('Add')
              .on('click', async function() {
                if ( draft.errors_ ) return;   // amount > 0 + ingredient required
                var savedIA = await self.ingredientAmountDAO.put(draft);
                await self.ensureStepSaved(step);
                // add() creates the junction row linking the amount to this step.
                await step.ingredientAmounts.add(savedIA);
                self.version++;         // re-render the table
                self.loadSearchDAO();   // make the new amount searchable in the dropdown
                popup.close();
              })
            .end()
            .start('button')
              .addClass(this.myClass('btn')).addClass(this.myClass('btn-secondary'))
              .add('Cancel')
              .on('click', () => popup.close())
            .end()
          .end()
        .end();

      this.add(popup);
    }
  ]
});
