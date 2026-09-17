/**
 * @license
 * Copyright 2025 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'com.foamdev.cook',
  name: 'UnitConversionPage',
  extends: 'foam.u2.Controller',

  documentation: `Landing page for the ConversionService nano-service.
    Lets the user enter an amount, pick source and target units, and see the
    converted result. Calls the server-side ConversionService over RPC;
    surfaces the server's error message when units are incompatible (e.g.
    converting a volume to a weight).`,

  requires: [
    'com.foamdev.cook.ConversionRequest',
    'com.foamdev.cook.Unit'
  ],

  imports: ['conversionService'],

  properties: [
    {
      class: 'Float',
      name: 'amount',
      value: 1,
      min: 0
    },
    {
      class: 'Enum',
      of: 'com.foamdev.cook.Unit',
      name: 'fromUnit',
      factory: function() { return this.Unit.CUP; }
    },
    {
      class: 'Enum',
      of: 'com.foamdev.cook.Unit',
      name: 'toUnit',
      factory: function() { return this.Unit.MILLILITER; }
    },
    {
      class: 'Float',
      name: 'result'
    },
    {
      class: 'Boolean',
      name: 'hasResult'
    },
    {
      class: 'String',
      name: 'conversionError'
    },
    {
      class: 'Boolean',
      name: 'converting'
    },
    {
      class: 'String',
      name: 'resultMessage'
    }
  ],

  css: `
    ^ {
      max-width: 680px;
      margin: 40px auto;
      padding: 0 24px;
      font-family: sans-serif;
    }
    ^header { margin-bottom: 28px; }
    ^header h2 { font-size: 26px; font-weight: 600; margin: 0 0 8px; color: #1a1a1a; }
    ^header p { color: #666; margin: 0; font-size: 15px; line-height: 1.5; }

    ^card {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 28px;
    }

    ^form-row {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    }
    ^field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      min-width: 120px;
    }
    ^field-label {
      font-size: 13px;
      font-weight: 500;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    ^btn-wrap {
      padding-bottom: 2px;
    }

    ^result {
      margin-top: 24px;
      padding: 20px 24px;
      background: #f0f7ff;
      border: 1px solid #bdd7f5;
      border-radius: 6px;
    }
    ^result-value {
      font-size: 28px;
      font-weight: 700;
      color: #0055cc;
      letter-spacing: -0.5px;
    }
    ^result-label {
      font-size: 14px;
      color: #555;
      margin-top: 6px;
    }

    ^error {
      margin-top: 24px;
      padding: 16px 20px;
      background: #fff5f5;
      border: 1px solid #ffcccc;
      border-radius: 6px;
      color: #cc0000;
      font-size: 14px;
    }

    ^note {
      margin-top: 16px;
      font-size: 13px;
      color: #888;
    }
  `,

  actions: [
    {
      name: 'convert',
      label: 'Convert',
      isEnabled: function(converting, amount) {
        return ! converting && amount > 0;
      },
      code: async function() {
        this.converting      = true;
        this.conversionError = '';
        this.hasResult       = false;

        try {
          var request  = this.ConversionRequest.create({
            amount:   this.amount,
            fromUnit: this.fromUnit,
            toUnit:   this.toUnit
          });
          var response     = await this.conversionService.convert(this.__subContext__, request);
          this.result      = response.amount;
          this.resultMessage = response.message || '';
          this.hasResult   = true;
        } catch(e) {
          this.conversionError = (e && (e.message || e.toString())) || 'Conversion failed.';
        } finally {
          this.converting = false;
        }
      }
    }
  ],

  methods: [
    function render() {
      var self = this;
      this.SUPER();

      this.addClass()
        .start().addClass(this.myClass('header'))
          .start('h2').add('Unit Converter').end()
          .start('p')
            .add('Convert between volume and weight units used in recipes. ')
            .add('Enter an amount, choose the units, and click Convert.')
          .end()
        .end()

        .start().addClass(this.myClass('card'))
          .start().addClass(this.myClass('form-row'))
            .start().addClass(this.myClass('field'))
              .start('label').addClass(this.myClass('field-label')).add('Amount').end()
              .startContext({ data: self })
                .add(self.AMOUNT)
              .endContext()
            .end()
            .start().addClass(this.myClass('field'))
              .start('label').addClass(this.myClass('field-label')).add('From').end()
              .startContext({ data: self })
                .add(self.FROM_UNIT)
              .endContext()
            .end()
            .start().addClass(this.myClass('field'))
              .start('label').addClass(this.myClass('field-label')).add('To').end()
              .startContext({ data: self })
                .add(self.TO_UNIT)
              .endContext()
            .end()
            .start().addClass(this.myClass('btn-wrap'))
              .startContext({ data: self })
                .add(self.CONVERT)
              .endContext()
            .end()
          .end()

          .add(this.dynamic(function(hasResult, result, conversionError, fromUnit, toUnit, amount, resultMessage) {
            if ( conversionError ) {
              this.start().addClass(self.myClass('error'))
                .add(conversionError)
              .end();
              return;
            }
            if ( hasResult ) {
              var fromLabel = fromUnit ? fromUnit.label : '';
              var toLabel   = toUnit   ? toUnit.label   : '';
              this.start().addClass(self.myClass('result'))
                .start().addClass(self.myClass('result-value'))
                  .add((result % 1 === 0 ? result : result.toFixed(4).replace(/\.?0+$/, '')) + ' ' + toLabel)
                .end()
                .start().addClass(self.myClass('result-label'))
                  .add(amount + ' ' + fromLabel + ' = ' + result.toFixed(4).replace(/\.?0+$/, '') + ' ' + toLabel)
                .end()
                .callIf(resultMessage, function() {
                  this.start('p').addClass(self.myClass('note'))
                    .add(resultMessage)
                  .end();
                })
              .end();
            }
          }))
        .end();
    }
  ]
});
