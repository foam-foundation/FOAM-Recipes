foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'RecipeStep',

  properties: [
    {
      class: 'Long',
      name: 'id',
      createVisibility: 'HIDDEN',
      updateVisibility: 'RO'
    },
    {
      class: 'Int',
      name: 'rank',
      // Ordering is assigned by the create screen (and would be by drag-reorder in a
      // richer UI), not typed in by hand — so keep it out of the generated forms.
      hidden: true
    },
    {
      class: 'String',
      name: 'instruction',
      view: { class: 'foam.u2.tag.TextArea', rows: 4, cols: 80 }
    },
    {
      class: 'Enum',
      of: 'com.foamdev.cook.StepCategory',
      name: 'category'
    },
    {
      class: 'Boolean',
      name: 'isPrep',
      label: 'Prep Step',
      value: false
    }
  ],

  methods: [
    function toSummary() {
      return 'Step ' + this.rank + ': ' + this.instruction?.substring(0, 50);
    }
  ]
})
