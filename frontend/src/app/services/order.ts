import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderItem } from './orders';
import { environment } from '../../environments/environment';

export interface OrderItemRequest {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
customerName: string;
phone: string;
address: string;
items: OrderItemRequest[];
}

export interface CreateOrderResponse {
success: boolean;
message: string;
order: Order;
}


@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private apiUrl = `${environment.apiUrl}/api/orders`;

  constructor(
    private http: HttpClient
  ) {}

  createOrder(
    order: CreateOrderRequest
  ): Observable<CreateOrderResponse> {

    return this.http.post<CreateOrderResponse>(
  this.apiUrl,
  order
);

  }

  downloadInvoice(orderId: string): Observable<Blob> {
  return this.http.get(
    `${this.apiUrl}/${orderId}/invoice`,
    {
      responseType: 'blob'
    }
  );
}

}