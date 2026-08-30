/**
 * @license
 * Copyright 2025 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'IngredientAmountDetailView',
  extends: 'foam.comics.v3.DetailView',

  documentation: `Faceted detail view for IngredientAmount.

    foam.comics.v3.DetailView carries the Faceted axiom, so naming this class
    <Model>DetailView (IngredientAmount + DetailView) makes the comics flow
    auto-discover it wherever an IngredientAmount detail is shown — no per-menu
    config.detailView needed.

    This is a thin wrapper: it inherits the detail chrome (title, save/cancel
    actions) from DetailView and points viewView at the built-in TabbedDetailView,
    which renders the model's sections ('Ingredient', 'Alternative') as tabs.
    (The detail flow already defaults to TabbedDetailView; this makes it explicit
    and symmetric with IngredientAmountCreateView.)`,

  properties: [
    {
      class: 'foam.u2.ViewSpec',
      name: 'viewView',
      factory: function() {
        return { class: 'foam.u2.detail.TabbedDetailView', hideActions: true };
      }
    }
  ]
});
