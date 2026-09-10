foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'Recipe',

  implements: [
    'foam.core.auth.CreatedAware',
    'foam.core.auth.LastModifiedAware'
  ],

  tableColumns: [
    'id',
    'name',
    'category',
    'description'
  ],

  searchColumns: [
    'name',
    'category'
  ],

  properties: [
    {
      class: 'Long',
      name: 'id',
      createVisibility: 'HIDDEN',
      updateVisibility: 'RO'
    },
    {
      class: 'String',
      name: 'name',
      required: true
    },
    {
      class: 'Enum',
      of: 'com.foamdev.cook.RecipeCategory',
      name: 'category',
      value: 'OTHER'
    },
    {
      class: 'String',
      name: 'description'
    },
    {
      // UI-only working set of steps while editing; the save ComicsAction persists them.
      class: 'Array',
      name: 'editSteps',
      transient: true,
      hidden: true
    },
    {
      // Ids present when editing began; lets discardSteps keep pre-existing steps on Cancel.
      class: 'Array',
      name: 'loadedStepIds',
      transient: true,
      hidden: true
    }
  ],

  methods: [
    function sampleMethod() {
      return 'Hello World!';
    },
    function toSummary() {
      return this.name;
    },
    function toString() {
      return this.toSummary();
    },

    // Persist editSteps linked to recipeId, in list order (recipeId is only known after put).
    async function saveSteps(x, recipeId) {
      var steps = this.editSteps || [];
      for ( var i = 0 ; i < steps.length ; i++ ) {
        steps[i].recipe = recipeId;
        steps[i].rank   = i + 1;
        await x.recipeStepDAO.put(steps[i]);
      }
    },

    // Cancel cleanup: delete steps that got persisted (e.g. by the amounts picker) but
    // weren't pre-existing. On create loadedStepIds is empty, so all persisted steps go.
    async function discardSteps(x) {
      var loaded = this.loadedStepIds || [];
      var steps  = this.editSteps || [];
      for ( var i = 0 ; i < steps.length ; i++ ) {
        var step = steps[i];
        if ( step.id && loaded.indexOf(step.id) === -1 ) await step.removeWithJunctions(x);
      }
    }
  ],

  actions: [
    {
      // Overrides comics Save for edit and create; this=record, x=context. Persists the
      // recipe + its steps, then finishes per controller.
      class: 'foam.comics.v3.ComicsAction',
      name: 'save',
      code: async function(x) {
        // config is exported by the DAOController, so it's reachable from either flow.
        var recipe = await x.config.dao.put(this);
        await this.saveSteps(x, recipe.id);

        if ( x.detailView ) {
          // Edit: reflect the saved record and drop back to VIEW.
          x.detailView.data = recipe;
          x.detailView.finished.pub();
          x.config.dao.on.reset.pub();
          x.detailView.controllerMode = 'VIEW';
        } else if ( x.createView ) {
          // Create: navigate to the new record's detail.
          x.createView.data = recipe;
          x.createView.finished.pub();
          x.daoController && ( x.daoController.route = recipe.id );
        }
        x.notify(recipe.toSummary() + ' saved', '', foam.log.LogLevel.INFO, true);
      }
    },
    {
      // Overrides create's Cancel: clean up persisted steps, then back to browse.
      class: 'foam.comics.v3.ComicsAction',
      name: 'cancel',
      code: async function(x) {
        await this.discardSteps(x);
        if ( x.daoController ) x.daoController.routeToMe();
        else if ( x.createView ) await x.createView.stack.pop();
      }
    },
    {
      // Overrides edit's Cancel: clean up persisted steps, revert working copy, back to VIEW.
      class: 'foam.comics.v3.ComicsAction',
      name: 'cancelEdit',
      code: async function(x) {
        await this.discardSteps(x);
        var ctrl = x.detailView;
        ctrl.workingData    = ctrl.data.clone(ctrl);
        ctrl.controllerMode = 'VIEW';
      }
    }
  ]
});
