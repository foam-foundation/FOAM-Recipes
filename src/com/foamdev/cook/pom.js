foam.POM({
  name: 'recipe',
  projects: [
    { name: 'test/pom',                 flags: 'test' }
  ],
  files: [
    { name: 'Recipe',                  flags: 'js|java' },
    { name: 'RecipeCategory',          flags: 'js|java' },
    { name: 'StepCategory',            flags: 'js|java' },
    { name: 'Unit',                    flags: 'js|java' },
    { name: 'IngredientCategory',      flags: 'js|java' },
    { name: 'Ingredient',              flags: 'js|java' },
    { name: 'IngredientAmount',        flags: 'js|java' },
    { name: 'RecipeStep',              flags: 'js|java' },
    { name: 'Relationships',           flags: 'js|java' },
    { name: 'ConversionService',       flags: 'js|java' },
    { name: 'IngredientPickerView',    flags: 'js' },
    { name: 'AlternativePickerView',   flags: 'js' },
    { name: 'IngredientAmountSearch',  flags: 'js' },
    { name: 'RecipeStepIngredientAmountsView', flags: 'js' },
    { name: 'IngredientAmountCreateView', flags: 'js' },
    { name: 'RecipeView',              flags: 'js' },
    { name: 'RecipeCreateView2',        flags: 'js' },
    { name: 'RecipeCreateView3',        flags: 'js' }
  ],

  javaFiles: [
    { name: 'ServerConversionService' }
  ]
});
