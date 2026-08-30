/**
 * @license
 * Copyright 2025 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'AlternativePickerView',
  extends: 'foam.u2.view.ReferencePropertyView',

  documentation: `Custom property view for the 'alternative' reference on
    IngredientAmount. Its 'data' is the alternative's id (a Long). Extends the stock
    ReferencePropertyView — which already renders the reference dropdown (and resolves
    its DAO from the property) — and only adds the ability to create a new substitute
    in place: the create popup reuses the record's own 'main' section (amount / unit /
    ingredient), and the new record is persisted and referenced by id.

    Because it always renders a visible control, the Alternative section is never
    empty, so TabbedDetailView keeps showing its tab.`,

  imports: [
    'ingredientAmountDAO'
  ],

  requires: [
    'com.foamdev.cook.IngredientAmount',
    'foam.u2.dialog.Popup'
  ],

  css: `
    ^ { display: inline-flex; align-items: center; gap: 8px; }
    ^popup { display: flex; flex-direction: column; gap: 12px; padding: 24px; min-width: 360px; }
    ^popup-title { font-size: 18px; font-weight: bold; }
    ^actions { display: flex; gap: 8px; margin-top: 8px; }
    ^btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
    ^btn-primary { background: #0066cc; color: white; }
    ^btn-secondary { background: #666; color: white; }
  `,

  actions: [
    {
      name: 'newAlternative',
      label: 'New alternative',
      toolTip: 'Create a new substitute and reference it here',
      code: function() { this.createAlternative(); }
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
      // substitute in place, but only when the picker is editable.
      this.callIf(self.mode === foam.u2.DisplayMode.RW, function() {
        this.startContext({ data: self })
          .add(self.NEW_ALTERNATIVE)
        .endContext();
      });
    },

    function createAlternative() {
      var self  = this;
      var draft = this.IngredientAmount.create({}, this);
      var popup = this.Popup.create({}, this);

      popup
        .start().addClass(this.myClass('popup'))
          .start().addClass(this.myClass('popup-title')).add('New Alternative').end()
          // Reuse the record's own 'main' section form (amount / unit / ingredient),
          // which brings the ingredient picker + validation along for free.
          .startContext({ data: draft })
            .tag({
              class: 'foam.u2.detail.VerticalDetailView',
              data: draft,
              useSections: [ 'main' ]
            })
          .endContext()
          .start().addClass(this.myClass('actions'))
            .start('button')
              .addClass(this.myClass('btn')).addClass(this.myClass('btn-primary'))
              .add('Add')
              .on('click', async function() {
                if ( draft.errors_ ) return;   // amount > 0 + ingredient required
                var saved = await self.ingredientAmountDAO.put(draft);
                self.data = saved.id;           // reference the new substitute
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
