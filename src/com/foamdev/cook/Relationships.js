foam.RELATIONSHIP({
  sourceModel: 'com.foamdev.cook.Ingredient',
  targetModel: 'com.foamdev.cook.IngredientAmount',
  forwardName: 'ingredientAmounts',
  inverseName: 'ingredient',
  cardinality: '1:*',
  // Configure the injected 'ingredient' reference on IngredientAmount: required,
  // placed in the 'main' section, and rendered with the custom picker (which lets
  // you create a new ingredient in place). required's message shows under the field.
  targetProperty: {
    label: 'Ingredient',
    section: 'main',
    gridColumns: 4,
    required: true,
    view: { class: 'com.foamdev.cook.IngredientPickerView' },
    tableCellFormatter: async function() {
      let ingredient = await this.data.ingredient$find;
      this.add(ingredient.toSummary());
    }
  },
  sourceProperty: {
    hidden: true
  }
});

foam.RELATIONSHIP({
  sourceModel: 'com.foamdev.cook.Recipe',
  targetModel: 'com.foamdev.cook.RecipeStep',
  forwardName: 'steps',
  inverseName: 'recipe',
  cardinality: '1:*',
  targetProperty: {
    hidden: true
  }
});

foam.RELATIONSHIP({
  sourceModel: 'com.foamdev.cook.RecipeStep',
  targetModel: 'com.foamdev.cook.IngredientAmount',
  forwardName: 'ingredientAmounts',
  inverseName: 'recipeSteps',
  cardinality: '*:*',
  // Render the step's 'ingredientAmounts' with a custom view that lists the linked
  // amounts and lets you view/edit/remove/create them in place. Visibility is set
  // explicitly for all three modes: the list shows everywhere (RO in read mode), and
  // is editable on create and update. We must opt into 'RW' on create because a *:*
  // property is HIDDEN on create by default (no source id yet to hang a junction on) —
  // the view works around that by persisting the step on first add so the junction has
  // a real source id.
  sourceProperty: {
    label: 'Ingredients',
    view: { class: 'com.foamdev.cook.RecipeStepIngredientAmountsView' },
    createVisibility: 'RW',
    updateVisibility: 'RW',
    readVisibility: 'RO'
  }
});
