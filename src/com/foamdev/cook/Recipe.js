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
      // Temporary in-memory working copy of steps for the current edit/create session.
      // Not stored. The save ComicsAction persists them to the DAO when the user saves.
      class: 'Array',
      name: 'editSteps',
      transient: true,
      hidden: true
    },
    {
      // Snapshot of step ids that existed when editing began. Not stored.
      // discardSteps uses this to avoid deleting pre-existing steps when the user cancels.
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

  // In all action code functions: 'this' is the record, 'x' is the Comics execution
  // context — the same __context__ every FOAM object carries, injected by the controller.
  actions: [
    {
      // Overrides comics Save for edit and create. Persists the
      // recipe + its steps, then finishes per controller.
      class: 'foam.comics.v3.ComicsAction',
      name: 'save',
      code: async function(x) {
        // config is the controller's config, which has the DAO to persist the recipe. 
        var recipe = await x.config.dao.put(this);

        // now we can persist the steps, which need the recipeId to link to.
        await this.saveSteps(x, recipe.id);

        // adjust the view and navigation per Comics conventions: edit returns to VIEW, create navigates to the new record.
        var isEdit     = !! x.detailView;
        var innerView  = x.detailView || x.createView;
        innerView.data = recipe;
        innerView.finished.pub();
        if ( isEdit ) {
          // Broadcast reset to all DAO listeners so any live views re-query (needed to refresh BROWSE).
          x.config.dao.on.reset.pub();
          innerView.controllerMode = 'VIEW';
        } else {
          // Create: navigate to the new record's detail.
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
