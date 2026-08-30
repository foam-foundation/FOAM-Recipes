foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'IngredientAmount',

  sections: [
    { name: 'main',        title: 'Ingredient',  order: 1 },
    { name: 'other', title: 'Alternative', order: 2 }
  ],

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
    }
  ],

  methods: [
    function toSummary() {
      return this.amount + ' ' + this.unit?.label;
    }
  ]
})
