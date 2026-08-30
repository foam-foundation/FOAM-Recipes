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
    view: { class: 'com.foamdev.cook.IngredientPickerView' }
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
  cardinality: '1:*'
});

foam.RELATIONSHIP({
  sourceModel: 'com.foamdev.cook.RecipeStep',
  targetModel: 'com.foamdev.cook.IngredientAmount',
  forwardName: 'ingredientAmounts',
  inverseName: 'recipeSteps',
  cardinality: '*:*'
});
