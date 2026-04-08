/**
 * @license
 * Copyright 2025 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'RecipeDetailView',
  extends: 'foam.u2.View',

  documentation: 'Custom detail view for Recipe showing steps and ingredients',

  imports: [
    'recipeStepDAO',
    'ingredientDAO'
  ],

  css: `
    ^ {
      padding: 16px;
      font-family: sans-serif;
    }
    ^header {
      border-bottom: 2px solid #333;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    ^title {
      font-size: 24px;
      font-weight: bold;
      margin: 0 0 8px 0;
    }
    ^category {
      color: #666;
      font-style: italic;
    }
    ^description {
      margin-top: 12px;
      color: #444;
    }
    ^section {
      margin-top: 24px;
    }
    ^section-title {
      font-size: 18px;
      font-weight: bold;
      border-bottom: 1px solid #ccc;
      padding-bottom: 4px;
      margin-bottom: 12px;
    }
    ^step {
      margin-bottom: 16px;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    ^step-rank {
      font-weight: bold;
      color: #333;
    }
    ^step-category {
      font-size: 12px;
      color: #888;
      margin-left: 8px;
    }
    ^step-instruction {
      margin-top: 8px;
    }
    ^step-prep {
      font-size: 12px;
      color: #0066cc;
      margin-left: 8px;
    }
    ^ingredients {
      margin-top: 8px;
      padding-left: 16px;
    }
    ^ingredient {
      margin: 4px 0;
      color: #555;
    }
  `,

  methods: [
    function render() {
      var self = this;

      this.addClass()
        .start().addClass(this.myClass('header'))
          .start('h1').addClass(this.myClass('title')).add(this.data.name$).end()
          .start().addClass(this.myClass('category')).add(this.data.category$).end()
          .start().addClass(this.myClass('description')).add(this.data.description$).end()
        .end()

        // Steps Section
        .start().addClass(this.myClass('section'))
          .start().addClass(this.myClass('section-title')).add('Steps').end()
          .select(this.data.steps, function(step) {
            this
              .start().addClass(self.myClass('step'))
                .start('span').addClass(self.myClass('step-rank'))
                  .add('Step ', step.rank)
                .end()
                .callIf(step.category, function() {
                  this.start('span').addClass(self.myClass('step-category'))
                    .add('(', step.category.label, ')')
                  .end();
                })
                .callIf(step.isPrep, function() {
                  this.start('span').addClass(self.myClass('step-prep'))
                    .add('[Prep]')
                  .end();
                })
                .start().addClass(self.myClass('step-instruction'))
                  .add(step.instruction)
                .end()
                // Ingredients for this step
                .start().addClass(self.myClass('ingredients'))
                  .select(step.ingredientAmounts, function(ia) {
                    this.start().addClass(self.myClass('ingredient'))
                      .add(ia.amount, ' ', ia.unit?.label, ' ')
                      .call(async function() {
                        var ingredient = await self.ingredientDAO.find(ia.ingredient);
                        if ( ingredient ) this.add(ingredient.name);
                      })
                    .end();
                  })
                .end()
              .end();
          })
        .end();
    }
  ]
});
