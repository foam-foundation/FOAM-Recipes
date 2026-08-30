/**
 * @license
 * Copyright 2025 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'IngredientPickerView',
  extends: 'foam.u2.view.ReferencePropertyView',

  documentation: `Custom property view for an ingredient reference. Its 'data' is the
    ingredient id (a Long). Extends the stock ReferencePropertyView — which already
    renders the reference dropdown (and resolves its DAO from the property) — and only
    adds the ability to create a new ingredient in place, then select it, without
    leaving the form. Configured as the 'view' of IngredientAmount's 'ingredient'
    property (via the relationship's targetProperty), so every *DetailView renders the
    ingredient with this picker automatically.`,

  imports: [
    'ingredientDAO'
  ],

  requires: [
    'com.foamdev.cook.Ingredient',
    'foam.u2.dialog.Popup'
  ],

  css: `
    ^ { display: inline-flex; align-items: center; gap: 8px; }
    ^popup { display: flex; flex-direction: column; gap: 12px; padding: 24px; min-width: 320px; }
    ^popup-title { font-size: 18px; font-weight: bold; }
    ^popup input, ^popup select { width: 100%; height: 34px; box-sizing: border-box; }
    ^actions { display: flex; gap: 8px; margin-top: 8px; }
    ^btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
    ^btn-primary { background: #0066cc; color: white; }
    ^btn-secondary { background: #666; color: white; }
  `,

  actions: [
    {
      name: 'newIngredient',
      label: 'New ingredient',
      toolTip: 'Create a new ingredient and use it here',
      code: function() { this.createIngredient(); }
    }
  ],

  methods: [
    function fromProperty(prop) {
      // Let ReferencePropertyView/ReferenceView wire up the standard reference
      // selector (choices, selected value, and DAO resolution) from the property.
      this.SUPER(prop);
    },

    function render() {
      var self = this;

      // SUPER renders the stock reference selector (read or write view per mode).
      this.SUPER();

      // ...on top of which we add the only bit of custom behaviour: create a new
      // ingredient in place, but only when the picker is editable.
      this.callIf(self.mode === foam.u2.DisplayMode.RW, function() {
        this.startContext({ data: self })
          .add(self.NEW_INGREDIENT)
        .endContext();
      });
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
                self.data = saved.id;   // select the newly created ingredient
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
