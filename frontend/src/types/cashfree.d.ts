declare module '@cashfreepayments/cashfree-js' {

  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: string | HTMLElement;
  }

  export interface Cashfree {
    checkout(
      options: CashfreeCheckoutOptions
    ): Promise<any>;
  }

  export function load(options: {
    mode: 'sandbox' | 'production';
  }): Promise<Cashfree | null>;
}