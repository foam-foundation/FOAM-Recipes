/**
 * @license
 * Copyright 2025 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Session-scoped, lazily-built cache of a client-side DAO for searching
 * IngredientAmounts by their human-readable 'summary'.
 *
 * Why this exists: ingredientAmountDAO is a *served* ClientDAO, so a
 * .where(CONTAINS_IC(SUMMARY, ...)) predicate is shipped to the server — which can't
 * match it, because SUMMARY is transient and derived from the referenced Ingredient
 * (see IngredientAmount.summary). Searching a derived field therefore has to run
 * in-memory, over records whose summary has been materialized.
 *
 * Rather than have every picker rebuild that in-memory DAO on open (select-all +
 * resolve-every-summary), we build it ONCE per session and share the same promise.
 * Callers keep it current with refresh() after a create/edit instead of rebuilding.
 *
 * Note: the cache is per page/session. It won't observe amounts added by *other*
 * clients until reload — an acceptable trade for a picker's search list.
 */
foam.LIB({
  name: 'com.foamdev.cook.IngredientAmountSearch',

  methods: [
    // Returns a Promise<MDAO> of all IngredientAmounts with 'summary' resolved. The
    // first caller builds it; everyone else reuses the same cached promise.
    function dao(x) {
      if ( ! this.cachedDAO_ ) this.cachedDAO_ = this.build_(x);
      return this.cachedDAO_;
    },

    async function build_(x) {
      var mdao = foam.dao.MDAO.create({ of: com.foamdev.cook.IngredientAmount });
      var sink = await x.ingredientAmountDAO.select();
      // Pre-resolve each summary so the very first search matches: the expression is
      // async, so an as-yet-untouched record would still read '' at query time.
      await Promise.all(sink.array.map(async ia => {
        ia.summary = await ia.toSummary();
        await mdao.put(ia);
      }));
      return mdao;
    },

    // Keep the shared cache current after a create/edit — no full rebuild. Clone into
    // the caller's context so toSummary() can resolve the ingredient reference.
    async function refresh(x, ia) {
      var mdao = await this.dao(x);
      var obj  = ia.clone(x);
      obj.summary = await obj.toSummary();
      await mdao.put(obj);
    }
  ]
});
