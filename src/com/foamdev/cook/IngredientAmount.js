foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'IngredientAmount',

  sections: [
    { name: 'main',  title: 'Ingredient',  order: 1 },
    { name: 'other', title: 'Alternative', order: 2 }
  ],

  tableColumns: [ 'id', 'amount', 'unit', 'ingredient' ],

  properties: [
    {
      class: 'Long',
      name: 'id',
      createVisibility: 'HIDDEN',
      updateVisibility: 'RO'
    },
    {
      class: 'Float',
      name: 'amount',
      section: 'main',
      gridColumns: 4,
      // 'ingredient' is required via the relationship's targetProperty, so its
      // message shows under the ingredient field. Here we only guard the amount.
      validateObj: function(amount) {
        if ( ! ( amount > 0 ) ) return 'Enter an amount greater than 0.';
      }
    },
    {
      class: 'Enum',
      of: 'com.foamdev.cook.Unit',
      name: 'unit',
      section: 'main',
      gridColumns: 4
    },
    {
      // Optional substitute — a reference to another IngredientAmount (stored by
      // id). The custom picker lets you select an existing one or create a new
      // substitute in place, and keeps the Alternative section non-empty so its
      // tab always renders.
      class: 'Reference',
      of: 'com.foamdev.cook.IngredientAmount',
      name: 'alternative',
      targetDAOKey: 'ingredientAmountDAO',
      value: 0,
      section: 'other',
      view: { class: 'com.foamdev.cook.AlternativePickerView' }
    },
    {
      class: 'String',
      name: 'summary',
      storageTransient: true,
      hidden: true,
      javaFactory: `return toSummary();`
    }
  ],

  methods: [
    {
      name: 'toSummary',
      type: 'String',
      code: async function() {
        // Override toSummary() so that views and dropdowns (RichChoiceView calls
        // toSummary() on each row) show a human-readable label — "2 cups flour" —
        // rather than the default id. The ingredient field is a Reference (foreign key),
        // so resolving its name requires an async lookup via the generated ingredient$find.
        let ingredient = await this.ingredient$find;
        return ingredient.name + " " + this.amount + ' ' + this.unit?.label;
      },
      // Java override so the server can compute the label without a round-trip:
      // used by the storageTransient 'summary' javaFactory to pre-populate the field
      // before the record is serialized to the client.
      javaCode: `
        Ingredient ingredient = findIngredient(foam.lang.XLocator.get());
        return ingredient.getName() + " " + getAmount() + " " + ( getUnit() != null ? getUnit().getLabel() : "" );
      `
    }
  ]
});
