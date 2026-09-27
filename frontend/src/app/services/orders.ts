import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
export interface OrderItem {
  productId: string;
  productName: string;
  imageUrl: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  customerName: string;
  phone: string;
  address: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  success: boolean;
  count: number;
  orders: Order[];
}
 
@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  private apiUrl = `${environment.apiUrl}/api/orders`;

  constructor(
    private http: HttpClient
  ) {}

  getMyOrders(): Observable<OrdersResponse> {

  return this.http.get<OrdersResponse>(
    `${this.apiUrl}/my-orders`
  );

  }

  getAllOrders(): Observable<OrdersResponse> {

  return this.http.get<OrdersResponse>(
    this.apiUrl
  );

}

updateOrderStatus(
  orderId: string,
  status: string
): Observable<any> {

  return this.http.put(
    `${this.apiUrl}/${orderId}/status`,
    {
      status
    }
  );

}



}