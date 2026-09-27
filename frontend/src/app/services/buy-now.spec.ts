import { TestBed } from '@angular/core/testing';
import { BuyNow } from './buy-now';

describe('BuyNow', () => {
  let service: BuyNow;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BuyNow);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
