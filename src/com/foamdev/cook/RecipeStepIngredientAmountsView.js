/**
 * @license
 * Copyright 2025 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'RecipeStepIngredientAmountsView',
  extends: 'foam.u2.View',

  documentation: `Property view for a RecipeStep's 'ingredientAmounts' (*:* to
    IngredientAmount). Renders a compact list of the amounts linked to this step in
    ALL controller modes; the editing affordances light up only when the property is
    read-write (create / edit), driven by 'this.mode' (fed by PropertyBorder from the
    controllerMode).

    Interactions:
      - Click a row  -> details popup. Read-only in VIEW; in edit it edits a CLONE and
        saves on demand, so cancelling discards cleanly.
      - Remove (RW)  -> removes the ingredient from this step by deleting the *:*
        junction row only; the IngredientAmount itself is kept (reusable across steps).
      - Attach (RW)  -> a searchable dropdown to link an EXISTING amount to this step.
      - New (RW)     -> creates a brand-new IngredientAmount in place and links it.

    Searchable dropdown: an IngredientAmount's label (summary) derives from the
    *referenced* Ingredient, so it isn't a stored field and a server-backed DAO can't
    match on it. We point a RichChoiceView at a client-side (in-memory) DAO with
    searchBy: [ IngredientAmount.SUMMARY ], so typing filters on the readable summary in
    memory. That DAO is built once per session and shared via IngredientAmountSearch (not
    rebuilt per open); we keep it current with IngredientAmountSearch.refresh() after a
    create/edit. The summary itself is a self-populating expression on IngredientAmount.

    The *:* junction stores the step's id, so amounts can only be linked once the step
    is persisted. We reach the step via the detail view's exported 'objData' and, for a
    still-unsaved step, save it first (adopting the assigned id in place so the
    surrounding create/Save flow just updates the same record) before creating a
    junction. Re-access 'step.ingredientAmounts' for each op so the relationship impl is
    bound to the step's current id, and bump 'invalidate' to re-render the list.`,

  requires: [
    'com.foamdev.cook.IngredientAmount',
    'foam.log.LogLevel',
    'foam.u2.ControllerMode',
    'foam.u2.dialog.Popup',
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
      // populated, so the dropdown can search on the readable label instead of a meaningless id.
      name: 'searchDAO'
    },
    {
      class: 'Int',
      name: 'selectedAmountId',
      documentation: 'Scratch selection for the attach dropdown; reset to 0 after use.'
    },
    {
      class: 'Int',
      name: 'invalidate',
      // Hand-rolled slot dependency: bump it to re-render the list. Add/remove mutate the
      // *:* junctionDAO, but we render the relationship's target DAO, which never sees
      // that change — so there's no DAO event to bind to. Alternative: subscribe to
      // step.ingredientAmounts.junctionDAO.on and rebuild; we signal ourselves instead
      // since this view owns every mutation.
      documentation: 'Bumped after add/remove/edit to re-render the list.'
    }
  ],

  css: `
    ^ { display: flex; flex-direction: column; gap: 8px; align-items: stretch; }
    ^empty { color: #888; font-style: italic; }
    ^row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px; padding: 8px 12px; background: #f9f9f9; border-radius: 4px;
      cursor: pointer;
    }
    ^row:hover { background: #f0f0f0; }
    ^row-label { color: #333; }
    ^add-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
    ^popup { display: flex; flex-direction: column; gap: 12px; padding: 24px; min-width: 360px; }
    ^popup-title { font-size: 18px; font-weight: bold; }
    ^popup-actions { display: flex; gap: 8px; margin-top: 8px; justify-content: flex-end; }
    ^btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
    ^btn-primary { background: #0066cc; color: white; }
    ^btn-secondary { background: #666; color: white; }
    ^btn-remove { background: #cc0000; color: white; padding: 4px 10px; }
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
      var self = this;
      // Grab the shared, session-cached search DAO (built once across all pickers).
      com.foamdev.cook.IngredientAmountSearch.dao(this.__context__)
        .then(d => { self.searchDAO = d; });
    },

    function render() {
      this.SUPER();
      var self = this;
      var DisplayMode = foam.u2.DisplayMode;

      // Attach an existing amount as soon as one is picked from the dropdown, then
      // reset the dropdown (which re-fires this listener with 0 — guarded below).
      this.onDetach(this.selectedAmountId$.sub(function() {
        if ( self.selectedAmountId ) self.attachExisting(self.selectedAmountId);
      }));

      this.addClass()
        // The list re-renders whenever 'invalidate' changes (add / remove / edit).
        .add(this.slot(function(invalidate) {
          var step = self.__context__.objData;
          var e = self.E();

          // A *:* needs the step's id to scope its junction, so only list rows once the
          // step exists. A fresh step has no amounts anyway, and querying at id 0 would
          // surface unrelated rows.
          if ( ! step || ! step.id ) {
            return e.start().addClass(self.myClass('empty'))
              .add('No ingredient amounts yet.')
            .end();
          }

          e.select(step.ingredientAmounts.dao, function(ia) {
            this.start().addClass(self.myClass('row'))
              .on('click', () => self.openDetails(ia))
              .start().addClass(self.myClass('row-label'))
                // 'summary' is a self-populating expression — bind its slot for a label
                // that fills in once the referenced Ingredient resolves.
                .add(ia.summary$)
              .end()
              .callIf(self.mode === DisplayMode.RW, function() {
                this.start('button')
                  .addClass(self.myClass('btn')).addClass(self.myClass('btn-remove'))
                  .add('Remove')
                  .on('click', function(evt) {
                    evt.stopPropagation();   // don't also open the details popup
                    self.removeAmount(ia);
                  })
                .end();
              })
            .end();
          });
          return e;
        }, self.invalidate$))

        // Attach existing (searchable dropdown) or create a new one in place — RW only.
        .callIf(this.mode === DisplayMode.RW, function() {
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

    // Details / edit popup for a single amount. In VIEW mode it's read-only; in edit
    // mode we edit a clone and only write it back on Save, so Cancel discards changes.
    function openDetails(ia) {
      var self = this;
      var editing = this.mode === foam.u2.DisplayMode.RW;
      var obj = editing ? ia.clone(this) : ia;
      var popup = this.Popup.create({}, this);

      popup
        .start().addClass(this.myClass('popup'))
          .start().addClass(this.myClass('popup-title'))
            .add(editing ? 'Edit Ingredient Amount' : 'Ingredient Amount')
          .end()
          .startContext({
            data: obj,
            controllerMode: editing ? this.ControllerMode.EDIT : this.ControllerMode.VIEW
          })
            .tag({
              class: 'foam.u2.detail.VerticalDetailView',
              data: obj,
              useSections: [ 'main' ]
            })
          .endContext()
          .start().addClass(this.myClass('popup-actions'))
            .callIf(editing, function() {
              this.start('button')
                .addClass(self.myClass('btn')).addClass(self.myClass('btn-primary'))
                .add('Save')
                .on('click', async function() {
                  if ( obj.errors_ ) return;   // amount > 0 + ingredient required
                  await self.ingredientAmountDAO.put(obj);
                  self.invalidate++;           // refresh the row label
                  // keep the shared search cache in sync with the edited summary
                  com.foamdev.cook.IngredientAmountSearch.refresh(self.__context__, obj);
                  popup.close();
                })
              .end();
            })
            .start('button')
              .addClass(this.myClass('btn')).addClass(this.myClass('btn-secondary'))
              .add(editing ? 'Cancel' : 'Close')
              .on('click', () => popup.close())
            .end()
          .end()
        .end();

      this.add(popup);
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
      await step.ingredientAmounts.add(ia);   // create the junction row
      this.invalidate++;
    },

    async function removeAmount(ia) {
      var step = this.__context__.objData;
      if ( ! step ) {
        this.notify('Could not resolve the recipe step.', '', this.LogLevel.ERROR);
        return;
      }
      // Deletes the *:* junction row only — the IngredientAmount is left intact so it
      // can still be used by other steps.
      await step.ingredientAmounts.remove(ia);
      this.invalidate++;
    },

    // Persist the step if it hasn't been yet, adopting the assigned id in place so the
    // surrounding create/Save flow just updates this same record. Returns the step, now
    // guaranteed to have an id the junction can reference.
    async function ensureStepSaved(step) {
      if ( ! step.id ) {
        var saved = await this.recipeStepDAO.put(step);
        step.id = saved.id;
      }
      return step;
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
                self.invalidate++;      // re-render the list
                // make the new amount searchable via the shared search cache
                com.foamdev.cook.IngredientAmountSearch.refresh(self.__context__, savedIA);
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
