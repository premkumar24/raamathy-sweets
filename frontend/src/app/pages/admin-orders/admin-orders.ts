import {  Component,  OnInit,  signal,  computed} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import {  Order, OrdersService} from '../../services/orders';
import { ToastService } from '../../services/toast';
@Component({
  selector: 'app-admin-orders',
  imports: [CommonModule,RouterLink],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css'
})
export class AdminOrders implements OnInit {

  orders = signal<Order[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  highlightedOrderId = signal<string | null>(null);
  isSpecificOrderView = signal(false);
  updatingOrderId = signal<string | null>(null);
  updatingDeliveryOrderId = signal<string | null>(null);
deliveryValidationErrors: {
  [orderId: string]: {
    courierName?: string;
    trackingId?: string;
  };
} = {};


deliveryDrafts: {
  [orderId: string]: {
    method: 'offline' | 'courier';
    courierName: string;
    trackingId: string;
    trackingUrl: string;
    shipmentStatus:
      | 'not_shipped'
      | 'in_transit'
      | 'out_for_delivery'
      | 'delivered';
  }
} = {};

  // --------------------------------------------------
  // Filters
  // --------------------------------------------------

  searchOrderId = signal('');

  selectedStatus = signal('ALL');

  filteredOrders = computed(() => {

    const search =
      this.searchOrderId()
        .trim()
        .toLowerCase();

    const status =
      this.selectedStatus();

    return this.orders().filter(order => {

      const matchesOrderId =
        !search ||
        order.orderNumber
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        status === 'ALL' ||
        order.status === status;

      return (
        matchesOrderId &&
        matchesStatus
      );

    });

  });

  paymentConfirmationStep = signal<1 | 2 | null>(null);

pendingStatusUpdate = signal<{
  orderId: string;
  status: string;
} | null>(null);

paymentConfirmationOrder = signal<Order | null>(null);

  constructor(
    private ordersService: OrdersService,
     private route: ActivatedRoute,
     private toastService: ToastService
  ) {}

ngOnInit(): void {

  this.route.queryParamMap.subscribe(() => {

    this.loadOrders();

  });

}

  loadOrders(): void {

  this.loading.set(true);

  this.errorMessage.set('');

  const orderId =
    this.route.snapshot.queryParamMap.get(
      'orderId'
    );

  this.isSpecificOrderView.set(
    !!orderId
  );

  this.ordersService
    .getAllOrders()
    .subscribe({

      next: (response) => {

        // Specific order view
        if (orderId) {

          const selectedOrder =
            response.orders.find(
              order =>
                order.orderNumber === orderId
            );

          if (selectedOrder) {

            this.orders.set([
              selectedOrder
            ]);

            this.highlightedOrderId.set(
              selectedOrder._id
            );

          } else {

            this.orders.set([]);

            this.errorMessage.set(
              `Order ${orderId} was not found.`
            );

          }

        }

        // Normal all-orders view
        else {

          this.orders.set(
            response.orders
          );

          this.highlightedOrderId.set(
            null
          );

        }

        // Initialize delivery drafts
        this.deliveryDrafts = {};

        response.orders.forEach(order => {

          this.deliveryDrafts[order._id] = {

            method:
              order.delivery?.method ||
              'offline',

            courierName:
              order.delivery?.courierName ||
              '',

            trackingId:
              order.delivery?.trackingId ||
              '',

            trackingUrl:
              order.delivery?.trackingUrl ||
              '',

            shipmentStatus:
              order.delivery?.shipmentStatus ||
              'not_shipped'

          };

        });

        this.loading.set(false);

      },

      error: (error) => {

        console.error(
          'ADMIN ORDERS ERROR:',
          error
        );

        this.orders.set([]);

        this.errorMessage.set(
          'Unable to load orders.'
        );

        this.loading.set(false);

      }

    });

}

  // --------------------------------------------------
  // Filter handlers
  // --------------------------------------------------

onSearchOrderId(event: Event): void {

  const input =
    event.target as HTMLInputElement;

  this.searchOrderId.set(
    input.value
  );

}

onStatusChange(event: Event): void {

  const select =
    event.target as HTMLSelectElement;

  this.selectedStatus.set(
    select.value
  );

}

  clearFilters(): void {

    this.searchOrderId.set('');

    this.selectedStatus.set('ALL');

  }

  // --------------------------------------------------
  // Order status update
  // --------------------------------------------------


updateStatus(
  orderId: string,
  status: string
): void {

  const order = this.orders().find(
    order => order._id === orderId
  );

  /*
   * Show custom payment confirmation
   * only when moving:
   *
   * PROCESSING
   *      ↓
   * READY_FOR_DELIVERY
   *
   * and payment is still pending.
   */
  if (
    order &&
    order.status === 'PROCESSING' &&
    status === 'READY_FOR_DELIVERY' &&
    order.payment?.status === 'PENDING'
  ) {

    this.pendingStatusUpdate.set({
      orderId,
      status
    });

    this.paymentConfirmationOrder.set(order);

    this.paymentConfirmationStep.set(1);

    return;
  }

  /*
   * Normal status update
   */
  this.performStatusUpdate(
    orderId,
    status
  );
}

performStatusUpdate(
  orderId: string,
  status: string
): void {

  this.updatingOrderId.set(orderId);

  this.ordersService
    .updateOrderStatus(
      orderId,
      status
    )
    .subscribe({

      next: (response) => {

        this.orders.update(
          orders =>
            orders.map(order =>
              order._id === orderId
                ? response.order
                : order
            )
        );

        this.updatingOrderId.set(null);

      },

      error: (error) => {

        console.error(
          'UPDATE STATUS ERROR:',
          error
        );

        this.errorMessage.set(
          'Unable to update order status.'
        );

        this.updatingOrderId.set(null);

      }

    });
}


continuePaymentConfirmation(): void {

  this.paymentConfirmationStep.set(2);

}

confirmOfflinePayment(): void {

  const pendingUpdate =
    this.pendingStatusUpdate();

  if (!pendingUpdate) {
    return;
  }

  this.closePaymentConfirmation();

  this.performStatusUpdate(
    pendingUpdate.orderId,
    pendingUpdate.status
  );

}
closePaymentConfirmation(): void {

  const pendingUpdate = this.pendingStatusUpdate();

  /*
   * If the admin cancelled the payment confirmation,
   * restore the dropdown to PROCESSING.
   */
  if (pendingUpdate) {

    this.orders.update(
      orders =>
        orders.map(order =>
          order._id === pendingUpdate.orderId
            ? {
                ...order,
                status: 'PROCESSING'
              }
            : order
        )
    );
  }

  this.paymentConfirmationStep.set(null);
  this.pendingStatusUpdate.set(null);
  this.paymentConfirmationOrder.set(null);
}

  updateDelivery(
  orderId: string
): void {

  const draft = this.deliveryDrafts[orderId];

  if (!draft) {
    this.errorMessage.set(
      'Please select delivery details.'
    );

    return;
  }

  this.deliveryValidationErrors[orderId] = {};

if (draft.method === 'courier') {

  if (!draft.courierName.trim()) {
    this.deliveryValidationErrors[orderId].courierName =
      'Courier partner is required.';
  }

  if (!draft.trackingId.trim()) {
    this.deliveryValidationErrors[orderId].trackingId =
      'Tracking ID is required.';
  }

  if (
    Object.keys(
      this.deliveryValidationErrors[orderId]
    ).length > 0
  ) {
    return;
  }
}

  this.updatingDeliveryOrderId.set(orderId);

  this.errorMessage.set('');

  this.ordersService
    .updateDeliveryDetails(
      orderId,
      draft
    )
    .subscribe({

      next: (response) => {

        this.orders.update(
          orders =>
            orders.map(order =>
              order._id === orderId
                ? response.order
                : order
            )
        );
        this.toastService.show(
    'Updated Delivery Details'
  );
        this.updatingDeliveryOrderId.set(null);

      },

      error: (error) => {

        this.toastService.show(
    'Failed to save Delivery Details, Try sometime later','error'
  );
        console.error(
          'UPDATE DELIVERY ERROR:',
          error
        );

        this.errorMessage.set(
          'Unable to update delivery details.'
        );

        this.updatingDeliveryOrderId.set(null);

      }

    });

}

setDeliveryMethod(
  orderId: string,
  method: 'offline' | 'courier'
): void {

  if (!this.deliveryDrafts[orderId]) {
    this.deliveryDrafts[orderId] = {
      method,
      courierName: '',
      trackingId: '',
      trackingUrl: '',
      shipmentStatus: 'not_shipped'
    };
  } else {
    this.deliveryDrafts[orderId].method = method;
  }

  this.deliveryDrafts = {
    ...this.deliveryDrafts
  };
}

setCourierName(
  orderId: string,
  courierName: string
): void {

  if (!this.deliveryDrafts[orderId]) {
    this.deliveryDrafts[orderId] = {
      method: 'courier',
      courierName: '',
      trackingId: '',
      trackingUrl: '',
      shipmentStatus: 'not_shipped'
    };
  }

  this.deliveryDrafts[orderId].courierName = courierName;

  this.deliveryDrafts = {
    ...this.deliveryDrafts
  };
}

setTrackingId(
  orderId: string,
  trackingId: string
): void {

  if (!this.deliveryDrafts[orderId]) {
    this.deliveryDrafts[orderId] = {
      method: 'courier',
      courierName: '',
      trackingId: '',
      trackingUrl: '',
      shipmentStatus: 'not_shipped'
    };
  }

  this.deliveryDrafts[orderId].trackingId = trackingId;

  this.deliveryDrafts = {
    ...this.deliveryDrafts
  };
}

setTrackingUrl(
  orderId: string,
  trackingUrl: string
): void {

  if (!this.deliveryDrafts[orderId]) {
    this.deliveryDrafts[orderId] = {
      method: 'courier',
      courierName: '',
      trackingId: '',
      trackingUrl: '',
      shipmentStatus: 'not_shipped'
    };
  }

  this.deliveryDrafts[orderId].trackingUrl = trackingUrl;

  this.deliveryDrafts = {
    ...this.deliveryDrafts
  };
}

setShipmentStatus(
  orderId: string,
  shipmentStatus:
    | 'not_shipped'
    | 'in_transit'
    | 'out_for_delivery'
    | 'delivered'
): void {

  if (!this.deliveryDrafts[orderId]) {
    this.deliveryDrafts[orderId] = {
      method: 'offline',
      courierName: '',
      trackingId: '',
      trackingUrl: '',
      shipmentStatus
    };
  } else {
    this.deliveryDrafts[orderId].shipmentStatus =
      shipmentStatus;
  }

  this.deliveryDrafts = {
    ...this.deliveryDrafts
  };
}

  getNextStatuses(
    status: string
  ): string[] {

    switch (status) {

      case 'AWAITING_CONFIRMATION':

        return [
          'CONFIRMED',
          'CANCELLED'
        ];

      case 'CONFIRMED':

        return [
          'PROCESSING',
          'CANCELLED'
        ];

      case 'PROCESSING':

        return [
          'READY_FOR_DELIVERY',
          'CANCELLED'
        ];

      case 'READY_FOR_DELIVERY':

        return [
          'DELIVERED',
          'CANCELLED'
        ];

      case 'DELIVERED':

        return [];

      case 'CANCELLED':

        return [];

      default:

        return [];

    }

  }

  getStatusLabel(
    status: string
  ): string {

    switch (status) {

      case 'AWAITING_CONFIRMATION':

        return 'Awaiting Confirmation';

      case 'READY_FOR_DELIVERY':

        return 'Ready for Delivery';

      default:

        return status
          .replaceAll('_', ' ')
          .toLowerCase()
          .replace(
            /\b\w/g,
            char => char.toUpperCase()
          );

    }

  }



}