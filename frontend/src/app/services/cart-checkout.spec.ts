import { TestBed } from '@angular/core/testing';
import { CartCheckout } from './cart-checkout';

describe('CartCheckout', () => {
  let service: CartCheckout;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartCheckout);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
