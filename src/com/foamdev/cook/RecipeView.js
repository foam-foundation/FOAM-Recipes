/**
 * @license
 * Copyright 2025 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'RecipeView',
  extends: 'foam.u2.View',

  documentation: `Custom detail view for Recipe, wired explicitly as the recipe menu's
    config.detailView (NOT named '...DetailView', to stay clear of the comics
    name-based facet, which would otherwise substitute this class in as the detail
    controller and never hand it data).

    It does NOT own its own edit lifecycle — the comics DetailView controller does.
    We react to the controller's 'controllerMode' (VIEW / EDIT) to switch between a
    read-only summary and editable forms, and let the controller's Edit/Save/Cancel
    drive it. The recipe's own fields are saved by the controller (it puts the working
    copy); its steps are separate RecipeStep records, so we persist those by riding the
    controller's 'finished' event, which fires only on a successful save.

    Steps render as out-of-the-box RecipeStep forms (VerticalDetailView) whose
    'ingredientAmounts' relationship uses RecipeStepIngredientAmountsView. Because the
    recipe already exists, new steps are linked to it immediately; removing a step
    deletes it and its *:* junction rows (the IngredientAmounts are kept — reusable).`,

  requires: [
    'com.foamdev.cook.Recipe',
    'com.foamdev.cook.RecipeStep'
  ],

  imports: [
    'recipeStepDAO',
    'ingredientDAO',
    'detailView?'
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
    ^section-header {
      border-bottom: 1px solid #ccc;
      padding-bottom: 4px;
      margin-bottom: 12px;
    }
    ^section-title {
      font-size: 18px;
      font-weight: bold;
    }
    ^step {
      margin-bottom: 16px;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    ^step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
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
    ^btn {
      padding: 6px 14px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
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
      class: 'Array',
      name: 'editSteps',
      documentation: 'Working copy of the recipe\'s steps while in edit mode.'
    }
  ],

  methods: [
    function init() {
      this.SUPER();
      var self = this;

      // foam.u2.Element already declares 'controllerMode' (a one-time factory snapshot
      // of the context's value), so we can't import it — and the snapshot wouldn't track
      // the controller's VIEW <-> EDIT toggle anyway. Follow the controller's slot so our
      // property (and the reactive render below) stays in sync, the same way SectionView does.
      if ( this.__context__.controllerMode$ ) {
        this.controllerMode$.follow(this.__context__.controllerMode$);
      }

      // When the controller switches to EDIT, load a fresh working copy of the steps.
      this.onDetach(this.controllerMode$.sub(function() {
        if ( self.controllerMode == 'EDIT' ) self.loadEditSteps();
      }));

      // The controller's Save persists only the recipe object, then pubs 'finished'.
      // Ride that to persist our separate RecipeStep records. Cancel doesn't fire
      // 'finished', so step edits are simply dropped on cancel.
      if ( this.detailView ) {
        this.onDetach(this.detailView.finished.sub(this.saveSteps));
      }
    },

    async function loadEditSteps() {
      var sink = await this.data.steps.orderBy(this.RecipeStep.RANK).select();
      this.editSteps = sink.array;
    },

    function render() {
      this.SUPER();
      var self = this;

      // Re-render on data load and on the controller's mode changes.
      this.addClass()
        .add(this.dynamic(function(data, controllerMode) {
          if ( ! data ) return;
          var editing = controllerMode == 'EDIT';

          this
            .start().addClass(self.myClass('header'))
              // Read mode: formatted display (the controller titles the panel with the
              // record's name, so we don't repeat it). Edit mode: the recipe's fields.
              .callIf( ! editing, function() {
                this
                  .start().addClass(self.myClass('category'))
                    .add(data.category$.map(c => c ? c.label : ''))
                  .end()
                  .start().addClass(self.myClass('description')).add(data.description$).end();
              })
              .callIf( editing, function() {
                this.startContext({ data: data })
                  .add(self.Recipe.NAME.__)
                  .add(self.Recipe.CATEGORY.__)
                  .add(self.Recipe.DESCRIPTION.__)
                .endContext();
              })
            .end()

            // Steps Section
            .start().addClass(self.myClass('section'))
              .start().addClass(self.myClass('section-header'))
                .start().addClass(self.myClass('section-title')).add('Steps').end()
              .end()

              // Read mode: formatted, read-only summary of each step.
              .callIf( ! editing, function() {
                this.select(data.steps, function(step) {
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
                });
              })

              // Edit mode: each step in an out-of-the-box editable form, plus add/remove.
              .callIf( editing, function() {
                this.start('button')
                  .addClass(self.myClass('btn')).addClass(self.myClass('btn-secondary'))
                  .add('Add Step')
                  .on('click', () => self.addStep())
                .end()
                .add(self.dynamic(function(editSteps) {
                  this.forEach(editSteps, function(step, index) {
                    this
                      .start().addClass(self.myClass('step'))
                        .start().addClass(self.myClass('step-header'))
                          .start('strong').add('Step ', index + 1).end()
                          .start('button')
                            .addClass(self.myClass('btn')).addClass(self.myClass('btn-danger'))
                            .add('Remove')
                            .on('click', () => self.removeStep(index))
                          .end()
                        .end()
                        .tag({
                          class: 'foam.u2.detail.VerticalDetailView',
                          data: step
                        })
                      .end();
                  });
                }));
              })
            .end();
        }));
    },

    function addStep() {
      // The recipe already exists, so link the step to it right away — no orphan
      // window. Created in this view's context so its relationship DAOs resolve.
      var step = this.RecipeStep.create({
        recipe: this.data.id,
        rank: this.editSteps.length + 1
      }, this);
      this.editSteps = [...this.editSteps, step];
    },

    async function removeStep(index) {
      var step = this.editSteps[index];

      var arr = [...this.editSteps];
      arr.splice(index, 1);
      arr.forEach((s, i) => s.rank = i + 1);
      this.editSteps = arr;

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
    }
  ],

  listeners: [
    async function saveSteps() {
      // Fired on the controller's 'finished' (i.e. after a successful Save). Persist
      // step field edits and any newly added steps, re-ranked in list order. Each
      // step already carries its 'recipe' reference (loaded steps have it; added ones
      // set it on creation), so this doesn't depend on this.data mid-reload.
      for ( var i = 0; i < this.editSteps.length; i++ ) {
        var step = this.editSteps[i];
        step.rank = i + 1;
        await this.recipeStepDAO.put(step);
      }
    }
  ]
});
