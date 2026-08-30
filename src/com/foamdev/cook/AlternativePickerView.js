/**
 * @license
 * Copyright 2025 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'AlternativePickerView',
  extends: 'foam.u2.View',

  documentation: `Custom property view for the 'alternative' reference on
    IngredientAmount. Its 'data' is the alternative's id (a Long). Lets you pick an
    existing IngredientAmount OR create a new substitute in place — the create popup
    reuses the record's own 'main' section (amount / unit / ingredient) so you get
    the same form, and the new record is persisted and referenced by id.

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
    ^row { display: flex; align-items: center; gap: 8px; }
    ^select { min-width: 200px; height: 34px; box-sizing: border-box; }
    ^popup { display: flex; flex-direction: column; gap: 12px; padding: 24px; min-width: 360px; }
    ^popup-title { font-size: 18px; font-weight: bold; }
    ^actions { display: flex; gap: 8px; margin-top: 8px; }
    ^btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
    ^btn-primary { background: #0066cc; color: white; }
    ^btn-secondary { background: #666; color: white; }
  `,

  properties: [
    {
      class: 'Array',
      name: 'availableAmounts',
      documentation: 'Cached IngredientAmount list backing the selector.'
    },
    {
      class: 'Int',
      name: 'version',
      documentation: 'Bumped after creating an alternative to refresh the selector.'
    }
  ],

  actions: [
    {
      name: 'newAlternative',
      label: 'New alternative',
      toolTip: 'Create a new substitute and reference it here',
      code: function() { this.createAlternative(); }
    }
  ],

  methods: [
    function init() {
      this.SUPER();
      this.loadAmounts();
    },

    async function loadAmounts() {
      var sink = await this.ingredientAmountDAO.select();
      this.availableAmounts = sink.array;
    },

    function render() {
      this.SUPER();
      var self = this;

      // data is the alternative id; dynamic() binds the arg names to this view.
      this.addClass()
        .add(this.dynamic(function(data, availableAmounts, version) {
          var choices = [ [0, '— none —'],
            ...availableAmounts.map(a => [a.id, a.toSummary()]) ];

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
            // ...or create a new substitute in place.
            .startContext({ data: self })
              .add(self.NEW_ALTERNATIVE)
            .endContext()
          .end();
        }));
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
                if ( draft.errors_ ) return;       // amount > 0 + ingredient required
                var saved = await self.ingredientAmountDAO.put(draft);
                self.data = saved.id;               // reference the new substitute
                await self.loadAmounts();            // refresh the cached list...
                self.version++;                      // ...and redraw the selector
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
