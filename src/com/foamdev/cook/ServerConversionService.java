/**
 * @license
 * Copyright 2025 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

package com.foamdev.cook;

import foam.lang.ContextAwareSupport;
import foam.lang.X;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Server-side implementation of ConversionService.
 * Converts between measurement units used in recipes.
 *
 * This is a pure business logic nano-service with no database dependency,
 * demonstrating the simplest form of a FOAM service.
 */
public class ServerConversionService extends ContextAwareSupport implements ConversionService {

  // Volume conversions to milliliters (base unit)
  private static final Map<Unit, Double> VOLUME_TO_ML = new HashMap<>();

  // Weight conversions to grams (base unit)
  private static final Map<Unit, Double> WEIGHT_TO_GRAMS = new HashMap<>();

  private static final Set<Unit> VOLUME_UNITS;
  private static final Set<Unit> WEIGHT_UNITS;

  static {
    // Volume units → milliliters
    VOLUME_TO_ML.put(Unit.TEA_SPOON, 4.929);
    VOLUME_TO_ML.put(Unit.TABLE_SPOON, 14.787);
    VOLUME_TO_ML.put(Unit.CUP, 236.588);
    VOLUME_TO_ML.put(Unit.MILLILITER, 1.0);
    VOLUME_TO_ML.put(Unit.LITER, 1000.0);
    VOLUME_TO_ML.put(Unit.PINCH, 0.6161);  // 1/8 teaspoon

    // Weight units → grams
    WEIGHT_TO_GRAMS.put(Unit.GRAM, 1.0);
    WEIGHT_TO_GRAMS.put(Unit.KILOGRAM, 1000.0);
    WEIGHT_TO_GRAMS.put(Unit.OUNCE, 28.3495);
    WEIGHT_TO_GRAMS.put(Unit.POUND, 453.592);

    VOLUME_UNITS = VOLUME_TO_ML.keySet();
    WEIGHT_UNITS = WEIGHT_TO_GRAMS.keySet();
  }

  public ServerConversionService(X x) {
    setX(x);
  }

  @Override
  public ConversionResponse convert(X x, ConversionRequest request) {
    ConversionResponse response = new ConversionResponse();

    Unit fromUnit = request.getFromUnit();
    Unit toUnit = request.getToUnit();
    double amount = request.getAmount();

    // Same unit - no conversion needed
    if ( fromUnit == toUnit ) {
      response.setAmount((float) amount);
      return response;
    }

    // Check if both units are volume
    if ( VOLUME_UNITS.contains(fromUnit) && VOLUME_UNITS.contains(toUnit) ) {
      double inMl = amount * VOLUME_TO_ML.get(fromUnit);
      double result = inMl / VOLUME_TO_ML.get(toUnit);
      response.setAmount((float) result);
      return response;
    }

    // Check if both units are weight
    if ( WEIGHT_UNITS.contains(fromUnit) && WEIGHT_UNITS.contains(toUnit) ) {
      double inGrams = amount * WEIGHT_TO_GRAMS.get(fromUnit);
      double result = inGrams / WEIGHT_TO_GRAMS.get(toUnit);
      response.setAmount((float) result);
      return response;
    }

    // Cross-conversion using water density (1 ml = 1 g) — accurate for water-based
    // liquids and a standard cooking approximation for other ingredients.
    if ( VOLUME_UNITS.contains(fromUnit) && WEIGHT_UNITS.contains(toUnit) ) {
      double inMl = amount * VOLUME_TO_ML.get(fromUnit);
      response.setAmount((float) (inMl / WEIGHT_TO_GRAMS.get(toUnit)));
      response.setMessage("Approximate — based on water density (1 ml = 1 g).");
      return response;
    }

    if ( WEIGHT_UNITS.contains(fromUnit) && VOLUME_UNITS.contains(toUnit) ) {
      double inMl = amount * WEIGHT_TO_GRAMS.get(fromUnit);
      response.setAmount((float) (inMl / VOLUME_TO_ML.get(toUnit)));
      response.setMessage("Approximate — based on water density (1 ml = 1 g).");
      return response;
    }

    throw new RuntimeException(String.format(
      "Cannot convert between %s and %s",
      fromUnit.getLabel(), toUnit.getLabel()));
  }
}
