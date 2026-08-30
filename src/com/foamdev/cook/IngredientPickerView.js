/**
 * @license
 * Copyright 2025 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'IngredientPickerView',
  extends: 'foam.u2.View',

  documentation: `Custom property view for an ingredient reference. Its 'data' is the
    ingredient id (a Long). Improves on the default reference view by letting you
    create a new ingredient in place — ingredients live in a different DAO — then
    selecting it, without leaving the form. Configured as the 'view' of
    IngredientAmount's 'ingredient' property (via the relationship's targetProperty),
    so every *DetailView renders the ingredient with this picker automatically.`,

  imports: [
    'ingredientDAO'
  ],

  requires: [
    'com.foamdev.cook.Ingredient',
    'foam.u2.dialog.Popup'
  ],

  css: `
    ^row { display: flex; align-items: center; gap: 8px; }
    ^select { min-width: 180px; height: 34px; box-sizing: border-box; }
    ^popup { display: flex; flex-direction: column; gap: 12px; padding: 24px; min-width: 320px; }
    ^popup-title { font-size: 18px; font-weight: bold; }
    ^popup input, ^popup select { width: 100%; height: 34px; box-sizing: border-box; }
    ^actions { display: flex; gap: 8px; margin-top: 8px; }
    ^btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
    ^btn-primary { background: #0066cc; color: white; }
    ^btn-secondary { background: #666; color: white; }
  `,

  properties: [
    {
      class: 'Array',
      name: 'availableIngredients',
      documentation: 'Cached ingredient list backing the selector.'
    },
    {
      class: 'Int',
      name: 'ingredientVersion',
      documentation: 'Bumped after creating an ingredient to refresh the selector.'
    }
  ],

  actions: [
    {
      name: 'newIngredient',
      label: 'New ingredient',
      toolTip: 'Create a new ingredient and use it here',
      code: function() { this.createIngredient(); }
    }
  ],

  methods: [
    function init() {
      this.SUPER();
      this.loadIngredients();
    },

    async function loadIngredients() {
      var sink = await this.ingredientDAO.select();
      this.availableIngredients = sink.array;
    },

    function render() {
      this.SUPER();
      var self = this;

      // data is the ingredient id; dynamic() binds the arg names to this view.
      this.addClass()
        .add(this.dynamic(function(data, availableIngredients, ingredientVersion) {
          var choices = [ [0, '— ingredient —'],
            ...availableIngredients.map(i => [i.id, i.name]) ];

          this.start().addClass(self.myClass('row'))
            .start('select').addClass(self.myClass('select'))
              .on('change', function(ev) { self.data = parseInt(ev.target.value) || 0; })
              .forEach(choices, function(c) {
                this.start('option')
                  .attrs({ value: c[0], selected: c[0] === data })
                  .add(c[1])
                .end();
              })
            .end()
            // ...or create one in place (action acts on this view via startContext).
            .startContext({ data: self })
              .add(self.NEW_INGREDIENT)
            .endContext()
          .end();
        }));
    },

    function createIngredient() {
      var self  = this;
      var draft = this.Ingredient.create({}, this);
      var popup = this.Popup.create({}, this);

      popup
        .start().addClass(this.myClass('popup'))
          .start().addClass(this.myClass('popup-title')).add('New Ingredient').end()
          .startContext({ data: draft })
            .start().add(self.Ingredient.NAME.__).end()
            .start().add(self.Ingredient.CATEGORY.__).end()
          .endContext()
          .start().addClass(this.myClass('actions'))
            .start('button')
              .addClass(this.myClass('btn')).addClass(this.myClass('btn-primary'))
              .add('Add')
              .on('click', async function() {
                var name = (draft.name || '').trim();
                if ( ! name ) { popup.close(); return; }
                var saved = await self.ingredientDAO.put(draft);
                self.data = saved.id;          // select the new ingredient
                await self.loadIngredients();   // refresh the cached list...
                self.ingredientVersion++;       // ...and redraw the selector
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
