/**
 * @license
 * Copyright 2025 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'IngredientAmountCreateView',
  extends: 'foam.comics.v3.CreateView',

  documentation: `Faceted create view for IngredientAmount.

    The comics create flow (foam.comics.v3.DAOController create branch) pushes a
    faceted foam.comics.v3.CreateView, so a <Model>CreateView class is auto-
    discovered for creating IngredientAmount records — the sibling of
    IngredientAmountDetailView for the view/edit path.

    Thin wrapper: inherits the create chrome (title, save/cancel) from CreateView
    and points viewView at the built-in TabbedDetailView so create shows the model's
    sections as tabs — the create flow otherwise defaults to a sectioned (card)
    layout, so this override is what makes create match the detail view.`,

  properties: [
    {
      class: 'foam.u2.ViewSpec',
      name: 'viewView',
/*       factory: function() {
        return { class: 'foam.u2.detail.TabbedDetailView', hideActions: true };
      } */
     factory: function() {
        return {
          class: 'foam.u2.view.FObjectView',
          detailView: { class: 'foam.u2.detail.TabbedDetailView' }
        };
      }
    }
  ]
});
