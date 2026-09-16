foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'RecipeStep',

  properties: [
    {
      class: 'Long',
      name: 'id',
      // Assigned by the DAO; never meaningful to show in the RecipeStep form (it's
      // always embedded inside a Recipe, never browsed on its own).
      hidden: true
    },
    {
      class: 'Int',
      name: 'rank',
      // Ordering is assigned by the create screen (and would be by drag-reorder in a
      // richer UI), not typed in by hand — so keep it out of the generated forms.
      hidden: true
    },
    {
      class: 'String',
      name: 'instruction',
      view: { class: 'foam.u2.tag.TextArea', rows: 4, cols: 80 }
    },
    {
      class: 'Enum',
      of: 'com.foamdev.cook.StepCategory',
      name: 'category'
    },
    {
      class: 'Boolean',
      name: 'isPrep',
      label: 'Prep Step',
      value: false
    }
  ],

  methods: [
    function toSummary() {
      return 'Step ' + this.rank + ': ' + this.instruction?.substring(0, 50);
    },

    // Delete this step's *:* junction rows (the IngredientAmounts are reusable, so
    // they're kept), then the step itself. Used when removing a step in edit and when
    // cleaning up a cancelled create. x supplies recipeStepDAO.
    async function removeWithJunctions(x) {
      if ( ! this.id ) return;
      var sink = await this.ingredientAmounts.dao.select();
      for ( var i = 0 ; i < sink.array.length ; i++ ) {
        await this.ingredientAmounts.remove(sink.array[i]);
      }
      await x.recipeStepDAO.remove(this);
    }
  ]
})
