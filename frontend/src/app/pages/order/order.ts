import { Component, signal , OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product';
import { ToastService } from '../../services/toast';
import {FormControl,FormGroup,ReactiveFormsModule,Validators} from '@angular/forms';
import { CartService } from '../../services/cart';
import {CreateOrderRequest,OrderService} from '../../services/order';
import { AuthService } from '../../services/auth';
import {BuyNowItem,BuyNowService} from '../../services/buy-now';
import {CartCheckoutService} from '../../services/cart-checkout';

@Component({
  selector: 'app-order',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './order.html',
  styleUrl: './order.css'
})
export class Order implements OnInit{

  isSubmitting = signal(false);

  orderSuccess = signal(false);

  errorMessage = signal('');

  orderNumber = signal('');
  orderId = signal('');

  buyNowItem = signal<BuyNowItem | null>(null);

checkoutItems = signal<BuyNowItem[]>([]);

  orderForm = new FormGroup({

    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2)
      ]
    }),

    phone: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^[6-9]\d{9}$/)
      ]
    }),

    address: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(10)
      ]
    })

  });

  constructor(
  public cartService: CartService,
  private orderService: OrderService,
  private productService: ProductService,
  private toastService: ToastService,
  private authService: AuthService,
  private buyNowService: BuyNowService,
  private cartCheckoutService: CartCheckoutService
) {}

ngOnInit(): void {

  const user =
    this.authService.currentUser();

  if (user) {

    this.orderForm.patchValue({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || ''
    });

  }

  const cartCheckoutItems =
    this.cartCheckoutService.items();

  const buyNowItem =
    this.buyNowService.item();

  if (cartCheckoutItems.length > 0) {

    this.checkoutItems.set(
      cartCheckoutItems
    );

    this.buyNowItem.set(null);

  } else if (buyNowItem) {

    this.buyNowItem.set(
      buyNowItem
    );

    this.checkoutItems.set([
      buyNowItem
    ]);

  } else {

    this.checkoutItems.set(
      this.cartService.items()
    );

  }

}

placeOrder(): void {

  if (this.orderSuccess()) {
    return;
  }

  if (this.orderForm.invalid) {

    this.orderForm.markAllAsTouched();

    return;
  }

  const buyNowItem =
    this.buyNowItem();

  const checkoutItems =
    buyNowItem
      ? [buyNowItem]
      : this.checkoutItems();

  if (checkoutItems.length === 0) {

    this.errorMessage.set(
      'Your cart is empty.'
    );

    return;
  }

  this.errorMessage.set('');
  this.isSubmitting.set(true);

  // Get the latest product information
  this.productService
    .getProducts()
    .subscribe({

      next: (response) => {

        let latestCheckoutItems:
          BuyNowItem[] = [];

        /*
         * BUY NOW
         */
        if (buyNowItem) {

          const latestProduct =
            response.products.find(
              product =>
                product._id ===
                buyNowItem.product._id
            );

          if (
            !latestProduct ||
            !latestProduct.isAvailable ||
            latestProduct.stock <= 0
          ) {

            this.isSubmitting.set(false);

            this.errorMessage.set(
              'This product is no longer available.'
            );

            return;
          }

          if (
            buyNowItem.quantity >
            latestProduct.stock
          ) {

            this.isSubmitting.set(false);

            this.errorMessage.set(
              'The available stock is less than your selected quantity.'
            );

            return;
          }

          latestCheckoutItems = [
            {
              product: latestProduct,
              quantity: buyNowItem.quantity
            }
          ];

        }

        /*
         * SELECTED CART ITEMS
         */
        else {

          this.cartService.syncProducts(
            response.products
          );

          const selectedCheckoutItems =
            this.checkoutItems();

          latestCheckoutItems =
            selectedCheckoutItems
              .map(item => {

                const latestProduct =
                  response.products.find(
                    product =>
                      product._id ===
                      item.product._id
                  );

                if (
                  !latestProduct ||
                  !latestProduct.isAvailable ||
                  latestProduct.stock <= 0
                ) {
                  return null;
                }

                if (
                  item.quantity >
                  latestProduct.stock
                ) {
                  return null;
                }

                return {
                  product: latestProduct,
                  quantity: item.quantity
                };

              })
              .filter(
                (
                  item
                ): item is BuyNowItem =>
                  item !== null
              );

          if (
            latestCheckoutItems.length === 0
          ) {

            this.isSubmitting.set(false);

            this.errorMessage.set(
              'Some selected products are no longer available.'
            );

            return;
          }

        }

        /*
         * CREATE ORDER REQUEST
         */
        const orderRequest:
          CreateOrderRequest = {

          customerName:
            this.orderForm.controls.name.value.trim(),

          phone:
            this.orderForm.controls.phone.value.trim(),

          address:
            this.orderForm.controls.address.value.trim(),

          items:
            latestCheckoutItems.map(item => ({

              productId:
                item.product._id,

              quantity:
                item.quantity

            }))

        };

        /*
         * CREATE ORDER
         */
        this.orderService
          .createOrder(orderRequest)
          .subscribe({

            next: (response) => {

              this.orderId.set(
                response.order._id
              );

              this.orderNumber.set(
                response.order.orderNumber
              );

              this.orderSuccess.set(true);

              this.isSubmitting.set(false);

              /*
               * CLEANUP AFTER SUCCESSFUL ORDER
               */

              if (buyNowItem) {

                this.buyNowService.clear();

              }

              else if (
                this.cartCheckoutService
                  .items()
                  .length > 0
              ) {

                const orderedItems =
                  this.cartCheckoutService.items();

                orderedItems.forEach(item => {

                  this.cartService
                    .removeFromCart(
                      item.product._id
                    );

                });

                this.cartCheckoutService.clear();

              }

              else {

                this.cartService.clearCart();

              }

              /*
               * UPDATE USER PROFILE
               */

              const phone =
                this.orderForm
                  .controls
                  .phone
                  .value
                  .trim();

              const address =
                this.orderForm
                  .controls
                  .address
                  .value
                  .trim();

              this.authService
                .updateProfile(
                  phone,
                  address
                )
                .subscribe({

                  next: (
                    profileResponse
                  ) => {

                    // Keep local user data updated
                    const currentUser =
                      this.authService
                        .currentUser();

                    if (currentUser) {

                      this.authService.setUser(
                        profileResponse.user,
                        this.authService
                          .getToken() || ''
                      );

                    }

                  },

                  error: (error) => {

                    // Profile update failure
                    // should NOT affect
                    // the already successful order.
                    console.error(
                      'PROFILE UPDATE ERROR:',
                      error
                    );

                  }

                });

              /*
               * DOWNLOAD INVOICE
               */

              setTimeout(() => {

                this.downloadInvoice();

              }, 1500);

            },

            error: (error) => {

              this.toastService.show(
                'Failed to Place the Order, Try Sometime Later'
              );

              console.error(
                'ORDER ERROR:',
                error
              );

              this.isSubmitting.set(false);

              this.errorMessage.set(
                error?.error?.message ||
                'Unable to place the order. Please try again.'
              );

            }

          });

      },

      error: (error) => {

        console.error(
          'PRODUCT REFRESH ERROR:',
          error
        );

        this.isSubmitting.set(false);

        this.errorMessage.set(
          'Unable to verify product availability. Please try again.'
        );

      }

    });

}

downloadInvoice(): void {

  const orderId = this.orderId();

  if (!orderId) {
    return;
  }

  this.orderService
    .downloadInvoice(orderId)
    .subscribe({

      next: (blob) => {

        const url =
          window.URL.createObjectURL(blob);

        const link =
          document.createElement('a');

        link.href = url;

        link.download =
          `${this.orderNumber()}.pdf`;

        link.click();

        window.URL.revokeObjectURL(url);
      },

      error: (error) => {

        console.error(
          'INVOICE DOWNLOAD ERROR:',
          error
        );

        this.errorMessage.set(
          'Unable to download the invoice. Please try again.'
        );

      }

    });
}

}