/**
 * @license
 * Copyright 2025 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'RecipeCreateView',
  extends: 'foam.u2.Controller',

  documentation: 'View for creating a new recipe with steps and ingredients',

  imports: [
    'recipeDAO',
    'recipeStepDAO',
    'ingredientAmountDAO',
    'ingredientDAO'
  ],

  requires: [
    'com.foamdev.cook.Recipe',
    'com.foamdev.cook.RecipeStep',
    'com.foamdev.cook.IngredientAmount',
    'foam.dao.MDAO'
  ],

  css: `
    ^ {
      padding: 16px;
      font-family: sans-serif;
      max-width: 800px;
    }
    ^title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 16px;
    }
    ^section {
      margin-top: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    ^section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    ^section-title {
      font-size: 18px;
      font-weight: bold;
    }
    ^field {
      margin-bottom: 12px;
    }
    ^field-label {
      display: block;
      font-weight: bold;
      margin-bottom: 4px;
    }
    ^step {
      background: white;
      padding: 12px;
      margin-bottom: 12px;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
    ^step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    ^ingredient {
      background: #fafafa;
      padding: 8px;
      margin: 8px 0;
      border-radius: 4px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    ^ingredient-amount {
      width: 60px;
    }
    ^ingredient-name {
      width: 150px;
    }
    ^ingredient-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    ^actions {
      margin-top: 24px;
      display: flex;
      gap: 12px;
    }
    ^btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    ^btn-primary {
      background: #0066cc;
      color: white;
    }
    ^btn-secondary {
      background: #666;
      color: white;
    }
    ^btn-danger {
      background: #cc0000;
      color: white;
    }
  `,

  properties: [
    {
      class: 'String',
      name: 'recipeName',
      label: 'Recipe Name'
    },
    {
      class: 'Enum',
      of: 'com.foamdev.cook.RecipeCategory',
      name: 'recipeCategory'
    },
    {
      class: 'String',
      name: 'recipeDescription',
      view: { class: 'foam.u2.tag.TextArea', rows: 3, cols: 60 }
    },
    {
      class: 'FObjectArray',
      of: 'com.foamdev.cook.RecipeStep',
      name: 'steps',
      factory: function() { return []; }
    },
    {
      class: 'Map',
      name: 'stepIngredients',
      documentation: 'Maps step index to array of IngredientAmounts',
      factory: function() { return {}; }
    },
    {
      class: 'Array',
      name: 'availableIngredients',
      documentation: 'Cached list of ingredients for selection'
    },
    {
      class: 'Map',
      name: 'ingredientNames',
      documentation: 'Maps stepIndex-iaIndex to ingredient name string',
      factory: function() { return {}; }
    },
    {
      class: 'Map',
      name: 'ingredientCategories',
      documentation: 'Maps stepIndex-iaIndex to ingredient category',
      factory: function() { return {}; }
    }
  ],

  methods: [
    function init() {
      this.SUPER();
      this.loadIngredients();
    },

    async function loadIngredients() {
      var sink = await this.ingredientDAO.select();
      this.availableIngredients = sink.array;
    },

    function render() {
      var self = this;

      this.addClass()
        .start().addClass(this.myClass('title')).add('Create New Recipe').end()

        // Recipe Basic Info
        .start().addClass(this.myClass('section'))
          .start().addClass(this.myClass('field'))
            .start('label').addClass(this.myClass('field-label')).add('Name').end()
            .tag({class: 'foam.u2.TextField', data$: this.recipeName$})
          .end()
          .start().addClass(this.myClass('field'))
            .start('label').addClass(this.myClass('field-label')).add('Category').end()
            .add(this.RECIPE_CATEGORY)
          .end()
          .start().addClass(this.myClass('field'))
            .start('label').addClass(this.myClass('field-label')).add('Description').end()
            .add(this.RECIPE_DESCRIPTION)
          .end()
        .end()

        // Steps Section
        .start().addClass(this.myClass('section'))
          .start().addClass(this.myClass('section-header'))
            .start().addClass(this.myClass('section-title')).add('Steps').end()
            .start('button')
              .addClass(this.myClass('btn'))
              .addClass(self.myClass('btn-secondary'))
              .add('+ Add Step')
              .on('click', () => this.addStep())
            .end()
          .end()
          .add(this.slot(function(steps, stepIngredients) {
            return this.E().forEach(steps, function(step, index) {
              var ingredients = stepIngredients[index] || [];
              this
                .start().addClass(self.myClass('step'))
                  .start().addClass(self.myClass('step-header'))
                    .start('strong').add('Step ', index + 1).end()
                    .start('button')
                      .addClass(self.myClass('btn'))
                      .addClass(self.myClass('btn-danger'))
                      .add('Remove')
                      .on('click', () => self.removeStep(index))
                    .end()
                  .end()
                  .start().addClass(self.myClass('field'))
                    .start('label').addClass(self.myClass('field-label')).add('Instruction').end()
                    .tag({class: 'foam.u2.tag.TextArea', rows: 2, cols: 50, data$: step.instruction$})
                  .end()
                  .start().addClass(self.myClass('field'))
                    .start('label').addClass(self.myClass('field-label')).add('Category').end()
                    .tag({class: 'foam.u2.view.ChoiceView', choices: com.foamdev.cook.StepCategory.VALUES.map(v => [v, v.label]), data$: step.category$})
                  .end()
                  .start().addClass(self.myClass('field'))
                    .tag({class: 'foam.u2.CheckBox', data$: step.isPrep$})
                    .add(' Prep step')
                  .end()

                  // Ingredients for this step
                  .start().addClass(self.myClass('field'))
                    .start('label').addClass(self.myClass('field-label')).add('Ingredients').end()
                    .forEach(ingredients, function(ia, iaIndex) {
                      var nameKey = index + '-' + iaIndex;
                      var existingChoices = [['', '-- Select existing --'], ...self.availableIngredients.map(i => [i.name, i.name])];
                      this.start().addClass(self.myClass('ingredient'))
                        // Row 1: Amount, Unit, Remove button
                        .start().addClass(self.myClass('ingredient-row'))
                          .start().addClass(self.myClass('ingredient-amount'))
                            .tag({class: 'foam.u2.FloatView', data$: ia.amount$})
                          .end()
                          .tag({class: 'foam.u2.view.ChoiceView', choices: com.foamdev.cook.Unit.VALUES.map(v => [v, v.label]), data$: ia.unit$})
                          .start('button')
                            .addClass(self.myClass('btn'))
                            .addClass(self.myClass('btn-danger'))
                            .add('X')
                            .on('click', () => self.removeIngredient(index, iaIndex))
                          .end()
                        .end()
                        // Row 2: Ingredient selection (dropdown or new name) + category
                        .start().addClass(self.myClass('ingredient-row'))
                          .start('select')
                            .on('change', function(e) {
                              if ( e.target.value ) {
                                var newMap = Object.assign({}, self.ingredientNames);
                                newMap[nameKey] = e.target.value;
                                self.ingredientNames = newMap;
                              }
                            })
                            .forEach(existingChoices, function(choice) {
                              this.start('option')
                                .attrs({value: choice[0], selected: choice[0] === self.ingredientNames[nameKey]})
                                .add(choice[1])
                              .end();
                            })
                          .end()
                          .add(' or ')
                          .start().addClass(self.myClass('ingredient-name'))
                            .tag({
                              class: 'foam.u2.TextField',
                              placeholder: 'New ingredient',
                              data: self.ingredientNames[nameKey] || '',
                              onKey: true
                            }).on('input', function(e) {
                              var newMap = Object.assign({}, self.ingredientNames);
                              newMap[nameKey] = e.target.value;
                              self.ingredientNames = newMap;
                            })
                          .end()
                          .start('select')
                            .on('change', function(e) {
                              var newMap = Object.assign({}, self.ingredientCategories);
                              newMap[nameKey] = e.target.value;
                              self.ingredientCategories = newMap;
                            })
                            .start('option').attrs({value: ''}).add('Category').end()
                            .forEach(com.foamdev.cook.IngredientCategory.VALUES, function(cat) {
                              this.start('option')
                                .attrs({value: cat.name, selected: cat.name === self.ingredientCategories[nameKey]})
                                .add(cat.label)
                              .end();
                            })
                          .end()
                        .end()
                      .end();
                    })
                    .start('button')
                      .addClass(self.myClass('btn'))
                      .addClass(self.myClass('btn-secondary'))
                      .add('+ Add Ingredient')
                      .on('click', () => self.addIngredient(index))
                    .end()
                  .end()
                .end();
            });
          }))
        .end()

        // Actions
        .start().addClass(this.myClass('actions'))
          .start('button')
            .addClass(this.myClass('btn'))
            .addClass(this.myClass('btn-primary'))
            .add('Save Recipe')
            .on('click', () => this.saveRecipe())
          .end()
        .end();
    },

    function addStep() {
      var step = this.RecipeStep.create({
        rank: this.steps.length + 1
      });
      this.steps = [...this.steps, step];
      // Initialize empty ingredients array for this step
      var newMap = Object.assign({}, this.stepIngredients);
      newMap[this.steps.length - 1] = [];
      this.stepIngredients = newMap;
    },

    function removeStep(index) {
      var newSteps = [...this.steps];
      newSteps.splice(index, 1);
      // Re-rank remaining steps
      newSteps.forEach((s, i) => s.rank = i + 1);
      this.steps = newSteps;

      // Update ingredients map
      var newMap = {};
      Object.keys(this.stepIngredients).forEach(key => {
        var k = parseInt(key);
        if ( k < index ) newMap[k] = this.stepIngredients[k];
        else if ( k > index ) newMap[k - 1] = this.stepIngredients[k];
      });
      this.stepIngredients = newMap;
    },

    function addIngredient(stepIndex) {
      var ia = this.IngredientAmount.create({
        amount: 1,
        unit: com.foamdev.cook.Unit.CUP
      });
      var newMap = Object.assign({}, this.stepIngredients);
      newMap[stepIndex] = [...(newMap[stepIndex] || []), ia];
      this.stepIngredients = newMap;
    },

    function removeIngredient(stepIndex, iaIndex) {
      var newMap = Object.assign({}, this.stepIngredients);
      var arr = [...(newMap[stepIndex] || [])];
      arr.splice(iaIndex, 1);
      newMap[stepIndex] = arr;
      this.stepIngredients = newMap;

      // Clean up ingredient names and categories - remove this entry and re-index subsequent ones
      var newNames = {};
      var newCats = {};
      Object.keys(this.ingredientNames).forEach(key => {
        var parts = key.split('-');
        var si = parseInt(parts[0]);
        var ii = parseInt(parts[1]);
        if ( si === stepIndex ) {
          if ( ii < iaIndex ) {
            newNames[key] = this.ingredientNames[key];
            if ( this.ingredientCategories[key] ) newCats[key] = this.ingredientCategories[key];
          } else if ( ii > iaIndex ) {
            var newKey = si + '-' + (ii - 1);
            newNames[newKey] = this.ingredientNames[key];
            if ( this.ingredientCategories[key] ) newCats[newKey] = this.ingredientCategories[key];
          }
        } else {
          newNames[key] = this.ingredientNames[key];
          if ( this.ingredientCategories[key] ) newCats[key] = this.ingredientCategories[key];
        }
      });
      this.ingredientNames = newNames;
      this.ingredientCategories = newCats;
    },

    async function findOrCreateIngredient(name, category) {
      if ( ! name || ! name.trim() ) return null;

      name = name.trim();

      // Search for existing ingredient by name
      var sink = await this.ingredientDAO
        .where(foam.mlang.predicate.Eq.create({
          arg1: com.foamdev.cook.Ingredient.NAME,
          arg2: name
        }))
        .select();

      if ( sink.array.length > 0 ) {
        return sink.array[0];
      }

      // Create new ingredient with category
      var ingredient = com.foamdev.cook.Ingredient.create({
        name: name
      });
      if ( category ) {
        ingredient.category = com.foamdev.cook.IngredientCategory[category];
      }
      return await this.ingredientDAO.put(ingredient);
    },

    async function saveRecipe() {
      if ( ! this.recipeName ) {
        alert('Please enter a recipe name');
        return;
      }

      // Create and save the recipe
      var recipe = this.Recipe.create({
        name: this.recipeName,
        category: this.recipeCategory,
        description: this.recipeDescription
      });

      recipe = await this.recipeDAO.put(recipe);

      // Save each step with the recipe reference
      for ( var i = 0; i < this.steps.length; i++ ) {
        var step = this.steps[i];
        step.recipe = recipe.id;
        step = await this.recipeStepDAO.put(step);

        // Save ingredient amounts for this step
        var ingredients = this.stepIngredients[i] || [];
        for ( var j = 0; j < ingredients.length; j++ ) {
          var ia = ingredients[j];
          var nameKey = i + '-' + j;
          var ingredientName = this.ingredientNames[nameKey];
          var ingredientCategory = this.ingredientCategories[nameKey];

          // Find or create the ingredient
          var ingredient = await this.findOrCreateIngredient(ingredientName, ingredientCategory);
          if ( ingredient ) {
            ia.ingredient = ingredient.id;
          }

          ia = await this.ingredientAmountDAO.put(ia);
          // Link to step via the *:* relationship
          await step.ingredientAmounts.put(ia);
        }
      }

      alert('Recipe "' + this.recipeName + '" saved successfully!');

      // Reset form
      this.recipeName = '';
      this.recipeDescription = '';
      this.recipeCategory = com.foamdev.cook.RecipeCategory.OTHER;
      this.steps = [];
      this.stepIngredients = {};
      this.ingredientNames = {};
      this.ingredientCategories = {};

      // Reload available ingredients
      this.loadIngredients();
    }
  ]
});
