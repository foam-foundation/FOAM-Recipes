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
  // Render the step's 'ingredientAmounts' with a custom view: a plain table of the
  // amounts on this step plus a button to create a new IngredientAmount in place (no
  // cross-usage table / add-existing chrome). Shown on create too (createVisibility
  // 'RW' — the *:* property is HIDDEN on create by default): the view persists the
  // step on first add so the junction has a real source id.
  sourceProperty: {
    label: 'Ingredients',
    view: { class: 'com.foamdev.cook.RecipeStepIngredientAmountsView' },
    createVisibility: 'RW'
  }
});
