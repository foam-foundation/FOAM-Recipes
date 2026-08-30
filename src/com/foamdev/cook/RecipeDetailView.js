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
      this.SUPER();
      var self = this;

      // data is loaded asynchronously by DAOSummaryView, so render reactively via
      // this.dynamic(): it re-runs when data arrives (null-guarded) and binds the
      // argument name to this view rather than to context.data.
      this.addClass()
        .add(this.dynamic(function(data) {
          if ( ! data ) return;

          this
            .start().addClass(self.myClass('header'))
              .start('h1').addClass(self.myClass('title')).add(data.name$).end()
              .start().addClass(self.myClass('category')).add(data.category$).end()
              .start().addClass(self.myClass('description')).add(data.description$).end()
            .end()

            // Steps Section
            .start().addClass(self.myClass('section'))
              .start().addClass(self.myClass('section-title')).add('Steps').end()
              .select(data.steps, function(step) {
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
                    // Ingredients for this step (*:* relationship — iterate its .dao)
                    .start().addClass(self.myClass('ingredients'))
                      .select(step.ingredientAmounts.dao, function(ia) {
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
        }));
    }

  ]
});
