/**
 * @license
 * Copyright 2025 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'RecipeCreateView3',
  extends: 'foam.u2.Controller',

  documentation: `View for creating a new recipe with steps. Each step renders with the
    out-of-the-box RecipeStep detail view instead of a hand-built form — its
    'ingredientAmounts' relationship is customized (RecipeStepIngredientAmountsView),
    so the step's ingredients (table + create-in-place) come along for free and this
    screen no longer builds step fields or ingredient rows itself.`,

  imports: [
    'recipeDAO',
    'recipeStepDAO',
    'notify',
    'routeTo'
  ],

  requires: [
    'com.foamdev.cook.Recipe',
    'com.foamdev.cook.RecipeStep',
    'foam.log.LogLevel'
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
    }
  ],

  methods: [
    function render() {
      this.SUPER();
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
            .add(this.ADD_STEP)
          .end()
          .add(this.dynamic(function(steps) {
            this.forEach(steps, function(step, index) {
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
                  // Out-of-the-box RecipeStep form. Its 'ingredientAmounts' relationship
                  // renders with RecipeStepIngredientAmountsView (table + create-in-place),
                  // so we no longer hand-build the step's fields or its ingredient rows.
                  .tag({
                    class: 'foam.u2.detail.VerticalDetailView',
                    data: step
                  })
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
          .start('button')
            .addClass(this.myClass('btn'))
            .addClass(this.myClass('btn-secondary'))
            .add('Cancel')
            .on('click', () => this.cancel())
          .end()
        .end();
    },

    async function removeStep(index) {
      var step = this.steps[index];

      // Drop it from the list first (and re-rank the rest).
      var newSteps = [...this.steps];
      newSteps.splice(index, 1);
      newSteps.forEach((s, i) => s.rank = i + 1);
      this.steps = newSteps;

      // The ingredient picker persists a step as soon as you attach an amount to it,
      // so a removed step may already be in the DAO (unlinked, recipe == 0). Delete it
      // and its junction rows so it doesn't linger as an orphan.
      await this.deleteStep(step);
    },

    // Delete a persisted step and the *:* junction rows tying it to its ingredient
    // amounts. The IngredientAmounts themselves are kept — they're reusable.
    async function deleteStep(step) {
      if ( ! step || ! step.id ) return;

      var sink = await step.ingredientAmounts.dao.select();
      for ( var i = 0; i < sink.array.length; i++ ) {
        await step.ingredientAmounts.remove(sink.array[i]);   // removes the junction only
      }

      await this.recipeStepDAO.remove(step);
    },

    async function cancel() {
      // Abandon the draft: any steps the picker already persisted are unlinked
      // (recipe == 0), so clean them up rather than leave orphans behind.
      for ( var i = 0; i < this.steps.length; i++ ) {
        await this.deleteStep(this.steps[i]);
      }
      this.routeTo('cookbook.recipe');
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

      // Link each step to the recipe. Ingredient amounts were already persisted (and
      // their *:* junctions created) by RecipeStepIngredientAmountsView as they were
      // added, so here we only attach each step to its recipe and save it.
      for ( var i = 0; i < this.steps.length; i++ ) {
        var step = this.steps[i];
        step.recipe = recipe.id;
        await this.recipeStepDAO.put(step);
      }

      this.notify('Recipe "' + this.recipeName + '" saved successfully!', '', this.LogLevel.INFO);

      // Leave the create view and go to the recipe list. Deep-linking to a single
      // record (cookbook.recipe/<id>) doesn't resolve through the menu route:
      // pushMenu_ can't find that id and falls back to the default menu
      // (createRecipe), which is why the screen appeared to stay on create.
      this.routeTo('cookbook.recipe');
    }
  ],

  actions: [
    {
      name: 'addStep',
      label: 'Add Step',
      buttonStyle: 'SECONDARY',
      code: function() {
        // Create the step in this view's context so its 'ingredientAmounts'
        // relationship can resolve its DAOs when the detail view renders it.
        var newStep = this.RecipeStep.create({
          rank: this.steps.length + 1
        }, this);
        this.steps = [...this.steps, newStep];
      }
    }
  ]
});
