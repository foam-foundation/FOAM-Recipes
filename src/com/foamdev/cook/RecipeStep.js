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
      name: 'rank'
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
