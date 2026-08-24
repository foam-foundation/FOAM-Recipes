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
    'ingredientDAO',
    'notify',
    'routeTo'
  ],

  requires: [
    'com.foamdev.cook.Recipe',
    'com.foamdev.cook.RecipeStep',
    'com.foamdev.cook.Ingredient',
    'com.foamdev.cook.IngredientAmount',
    'foam.dao.MDAO',
    'foam.log.LogLevel',
    'foam.u2.dialog.Popup'
  ],

  css: `
    ^ {
      padding: 16px;
      font-family: sans-serif;
      width: 100%;
      box-sizing: border-box;
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
    ^ingredient-select {
      min-width: 180px;
    }
    ^ingredient input,
    ^ingredient select {
      height: 34px;
      box-sizing: border-box;
    }
    ^ingredient button {
      height: 34px;
    }
    ^btn-icon {
      width: 34px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font: inherit;
      font-size: 18px;
      font-weight: bold;
      line-height: 1;
    }
    ^popup {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 24px;
      min-width: 320px;
    }
    ^popup-title {
      font-size: 18px;
      font-weight: bold;
    }
    ^popup input,
    ^popup select {
      width: 100%;
      height: 34px;
      box-sizing: border-box;
    }
    ^popup ^field {
      margin-bottom: 0;
    }
    ^popup ^actions {
      margin-top: 8px;
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
      label: 'Name',
      required: true
    },
    {
      class: 'Enum',
      of: 'com.foamdev.cook.RecipeCategory',
      name: 'recipeCategory',
      label: 'Category'
    },
    {
      class: 'String',
      name: 'recipeDescription',
      label: 'Description',
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
    },
    {
      class: 'Int',
      name: 'ingredientVersion',
      documentation: 'Bumped to force the steps list to re-render when map contents change in place (e.g. after creating a new ingredient), since Map properties compare by value.'
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
          .start().addClass(this.myClass('field')).add(this.RECIPE_NAME.__).end()
          .start().addClass(this.myClass('field')).add(this.RECIPE_CATEGORY.__).end()
          .start().addClass(this.myClass('field')).add(this.RECIPE_DESCRIPTION.__).end()
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
          .add(this.slot(function(steps, stepIngredients, ingredientVersion) {
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
                  .startContext({ data: step })
                    .start().addClass(self.myClass('field')).add(self.RecipeStep.INSTRUCTION.__).end()
                    .start().addClass(self.myClass('field')).add(self.RecipeStep.CATEGORY.__).end()
                    .start().addClass(self.myClass('field')).add(self.RecipeStep.IS_PREP.__).end()
                  .endContext()

                  // Ingredients for this step
                  .start().addClass(self.myClass('field'))
                    .start('label').addClass(self.myClass('field-label')).add('Ingredients').end()
                    .forEach(ingredients, function(ia, iaIndex) {
                      var nameKey = index + '-' + iaIndex;
                      var existingChoices = [['', '-- Select existing --'], ...self.availableIngredients.map(i => [i.name, i.name])];
                      this.start().addClass(self.myClass('ingredient'))
                        .start().addClass(self.myClass('ingredient-amount'))
                          .tag({class: 'foam.u2.FloatView', data$: ia.amount$})
                        .end()
                        .tag({class: 'foam.u2.view.ChoiceView', choices: com.foamdev.cook.Unit.VALUES.map(v => [v, v.label]), data$: ia.unit$})
                        .start('select')
                          .addClass(self.myClass('ingredient-select'))
                          .on('change', function(e) {
                            var newMap = Object.assign({}, self.ingredientNames);
                            newMap[nameKey] = e.target.value;
                            self.ingredientNames = newMap;
                          })
                          .forEach(existingChoices, function(choice) {
                            this.start('option')
                              .attrs({value: choice[0], selected: choice[0] === self.ingredientNames[nameKey]})
                              .add(choice[1])
                            .end();
                          })
                        .end()
                        .start('button', { tooltip: 'New ingredient' })
                          .addClass(self.myClass('btn'))
                          .addClass(self.myClass('btn-secondary'))
                          .addClass(self.myClass('btn-icon'))
                          .add('+')
                          .on('click', () => self.openNewIngredientPopup(index, iaIndex))
                        .end()
                        .start('button')
                          .addClass(self.myClass('btn'))
                          .addClass(self.myClass('btn-danger'))
                          .addClass(self.myClass('btn-icon'))
                          .add('×')
                          .on('click', () => self.removeIngredient(index, iaIndex))
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

    function openNewIngredientPopup(stepIndex, iaIndex) {
      var self    = this;
      var nameKey = stepIndex + '-' + iaIndex;
      var draft   = this.Ingredient.create({}, this);
      var popup   = this.Popup.create({}, this);

      popup
        .start().addClass(this.myClass('popup'))
          .start().addClass(this.myClass('popup-title')).add('New Ingredient').end()
          .start().addClass(this.myClass('field'))
            .start('label').addClass(this.myClass('field-label')).add('Name').end()
            .tag({ class: 'foam.u2.TextField', data$: draft.name$ })
          .end()
          .start().addClass(this.myClass('field'))
            .start('label').addClass(this.myClass('field-label')).add('Category').end()
            .tag({
              class: 'foam.u2.view.ChoiceView',
              placeholder: 'Category',
              choices: com.foamdev.cook.IngredientCategory.VALUES.map(c => [c, c.label]),
              data$: draft.category$
            })
          .end()
          .start().addClass(this.myClass('actions'))
            .start('button')
              .addClass(this.myClass('btn'))
              .addClass(this.myClass('btn-primary'))
              .add('Add')
              .on('click', function() {
                var name = (draft.name || '').trim();
                if ( ! name ) { popup.close(); return; }

                // Make the new ingredient selectable in the dropdowns.
                if ( ! self.availableIngredients.some(i => i.name === name) ) {
                  self.availableIngredients = [...self.availableIngredients, draft];
                }

                // Select it for this row and remember its category.
                var names = Object.assign({}, self.ingredientNames);
                names[nameKey] = name;
                self.ingredientNames = names;

                var cats = Object.assign({}, self.ingredientCategories);
                cats[nameKey] = draft.category ? draft.category.name : '';
                self.ingredientCategories = cats;

                // Re-render the step list so the new option shows and is selected.
                // The map contents changed in place, and Map properties compare by
                // value — so a shallow copy would compare equal and not fire. Bump a
                // version counter the slot depends on instead.
                self.ingredientVersion++;
                popup.close();
              })
            .end()
            .start('button')
              .addClass(this.myClass('btn'))
              .addClass(this.myClass('btn-secondary'))
              .add('Cancel')
              .on('click', () => popup.close())
            .end()
          .end()
        .end();

      this.add(popup);
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
      if ( this.errors_ ) {
        // errors_ is a list of [ propertyAxiom, message ] pairs. Name the fields
        // rather than say they're "highlighted" — an empty required field is shown
        // as a suggestion by PropertyBorder, not a red highlight.
        var missing = this.errors_.map(e => e[0].label || e[0].name).join(', ');
        this.notify('Please complete: ' + missing, '', this.LogLevel.ERROR);
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
          // Link to step via the *:* relationship (add() creates the junction record)
          await step.ingredientAmounts.add(ia);
        }
      }

      this.notify('Recipe "' + this.recipeName + '" saved successfully!', '', this.LogLevel.INFO);

      // Leave the create view and go to the recipe list. Deep-linking to a single
      // record (cookbook.recipe/<id>) doesn't resolve through the menu route:
      // pushMenu_ can't find that id and falls back to the default menu
      // (createRecipe), which is why the screen appeared to stay on create.
      this.routeTo('cookbook.recipe');
    }
  ]
});
