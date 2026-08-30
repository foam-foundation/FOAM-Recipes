foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'Ingredient',

  properties: [
    {
      class: 'Long',
      name: 'id',
      createVisibility: 'HIDDEN',
      updateVisibility: 'RO'
    },
    {
      class: 'String',
      name: 'name',
      required: true
    },
    {
      class: 'Enum',
      of: 'com.foamdev.cook.IngredientCategory',
      name: 'category'
    }
  ],

  methods: [
    {
      name: 'toSummary',
      type: 'String',
      code: async function() {
        return this.name;
      },
      javaCode: `
        return getName();
      `
    }
  ]
})
