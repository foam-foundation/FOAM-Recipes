/**
 * @license
 * Copyright 2025 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'ConversionRequest',

  documentation: 'Request object for unit conversion',

  properties: [
    {
      class: 'Float',
      name: 'amount',
      documentation: 'The amount to convert'
    },
    {
      class: 'Enum',
      of: 'com.foamdev.cook.Unit',
      name: 'fromUnit',
      documentation: 'The source unit'
    },
    {
      class: 'Enum',
      of: 'com.foamdev.cook.Unit',
      name: 'toUnit',
      documentation: 'The target unit'
    }
  ]
});

foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'ConversionResponse',

  documentation: 'Response object containing the converted amount and an optional note from the server.',

  properties: [
    {
      class: 'Float',
      name: 'amount',
      documentation: 'The converted amount'
    },
    {
      class: 'String',
      name: 'message',
      documentation: 'Optional note from the server, e.g. when conversion assumptions were made.'
    }
  ]
});

foam.INTERFACE({
  package: 'com.foamdev.cook',
  name: 'ConversionService',

  documentation: `
    A nano-service for converting between measurement units.
    Demonstrates the nano-service pattern with pure business logic
    and no database dependency.
  `,

  skeleton: true,
  client: true,

  methods: [
    {
      name: 'convert',
      documentation: 'Converts an amount from one unit to another',
      async: true,
      type: 'com.foamdev.cook.ConversionResponse',
      args: [
        {
          name: 'x',
          type: 'Context'
        },
        {
          name: 'request',
          type: 'com.foamdev.cook.ConversionRequest'
        }
      ]
    }
  ]
});
