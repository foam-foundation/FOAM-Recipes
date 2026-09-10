/**
 * @license
 * Copyright 2025 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'RecipeView',
  extends: 'foam.u2.View',

  documentation: `Custom detail form for Recipe, wired as the recipe menu's
    config.detailView. It renders ONLY the recipe's own fields and then each RecipeStep
    with the out-of-the-box RecipeStep detail view — which is already mode-aware (RO in
    VIEW, RW in EDIT) and already wires the *:* 'ingredientAmounts' to the custom
    RecipeStepIngredientAmountsView picker. Nothing about the step form is re-implemented
    here; RecipeSteps only make sense inside a Recipe, so this is where that prep work
    gets composed in.

    Steps are staged on the recipe's transient 'editSteps' (the same working-clone object
    the recipe's 'save' ComicsAction reads), so field edits and new steps commit with the
    recipe. Removing a step deletes it and its junctions immediately (IngredientAmounts
    are reusable, so they're kept).`,

  requires: [
    'com.foamdev.cook.Recipe',
    'com.foamdev.cook.RecipeStep'
  ],

  css: `
    ^ { padding: 16px; font-family: sans-serif; }
    ^section { margin-top: 24px; }
    ^section-title { font-size: 18px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 12px; }
    ^step { margin-bottom: 16px; padding: 12px; background: #f9f9f9; border-radius: 4px; }
    ^step-header { display: flex; justify-content: flex-end; margin-bottom: 8px; }
    ^btn { padding: 6px 14px; border: none; border-radius: 4px; cursor: pointer; }
    ^btn-secondary { background: #666; color: white; }
    ^btn-danger { background: #cc0000; color: white; }
  `,

  methods: [
    function init() {
      this.SUPER();

      // Element already declares controllerMode; follow the controller's slot to track
      // VIEW <-> EDIT (like SectionView).
      if ( this.__context__.controllerMode$ ) {
        this.controllerMode$.follow(this.__context__.controllerMode$);
      }

      // Keep the working step list in sync with the record. workingData is a fresh clone
      // on edit (and its transient editSteps starts empty), so reload on any data change.
      this.onDetach(this.data$.sub(() => this.loadSteps()));
      this.loadSteps();
    },

    async function loadSteps() {
      if ( ! this.data ) return;
      // A brand-new (create-mode) recipe has no id; don't query steps by a null id (it
      // could surface orphaned steps). Start empty.
      if ( ! this.data.id ) { this.data.editSteps = []; this.data.loadedStepIds = []; return; }
      var sink = await this.data.steps.orderBy(this.RecipeStep.RANK).select();
      this.data.editSteps     = sink.array;
      // Remember which steps pre-existed, so edit-Cancel only cleans up ones added now.
      this.data.loadedStepIds = sink.array.map(s => s.id);
    },

    function render() {
      this.SUPER();
      var self = this;

      this.addClass()
        .add(this.dynamic(function(data, controllerMode) {
          if ( ! data ) return;
          var editing = controllerMode == 'EDIT' || controllerMode == 'CREATE';

          // Recipe's own fields — PropertyBorders are mode-aware on their own.
          this.startContext({ data: data })
            .add(self.Recipe.NAME.__)
            .add(self.Recipe.CATEGORY.__)
            .add(self.Recipe.DESCRIPTION.__)
          .endContext();

          // Steps — each via the DEFAULT RecipeStep view (mode-aware; already wires the
          // ingredientAmounts picker). Add/Remove only when editing.
          this.start().addClass(self.myClass('section'))
            .start().addClass(self.myClass('section-title')).add('Steps').end()
            .callIf(editing, function() {
              this.start('button')
                .addClass(self.myClass('btn')).addClass(self.myClass('btn-secondary'))
                .add('Add Step')
                .on('click', () => self.addStep())
              .end();
            })
            .add(self.slot(function(editSteps) {
              var e = self.E();
              ( editSteps || [] ).forEach(function(step) {
                e.start().addClass(self.myClass('step'))
                  .callIf(editing, function() {
                    this.start().addClass(self.myClass('step-header'))
                      .start('button')
                        .addClass(self.myClass('btn')).addClass(self.myClass('btn-danger'))
                        .add('Remove')
                        .on('click', () => self.removeStep(step))
                      .end()
                    .end();
                  })
                  .tag({ class: 'foam.u2.detail.SectionedDetailView', data: step })
                .end();
              });
              return e;
            }, data.editSteps$))
          .end();
        }));
    },

    function addStep() {
      // The recipe already exists (edit mode), so link the step to it right away.
      var step = this.RecipeStep.create({
        recipe: this.data.id,
        rank: this.data.editSteps.length + 1
      }, this);
      this.data.editSteps = [ ...this.data.editSteps, step ];
    },

    async function removeStep(step) {
      var arr = this.data.editSteps.filter(s => s !== step);
      arr.forEach((s, i) => s.rank = i + 1);
      this.data.editSteps = arr;
      if ( step.id ) await step.removeWithJunctions(this.__context__);
    }
  ]
});
