import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Product {
  _id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  imageUrl: string;
  imagePublicId: string;
  stock: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductResponse {
  success: boolean;
  count: number;
  products: Product[];
}

export interface CreateProductRequest {
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  imageUrl: string;
  imagePublicId: string;
  stock: number;
  isAvailable: boolean;
}

export interface ProductImageUploadResponse {
  success: boolean;
  message: string;
  imageUrl: string;
  imagePublicId: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl = `${environment.apiUrl}/api/products`;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(this.apiUrl);
  }

  getProductById(id: string): Observable<{ success: boolean; product: Product }> {
    return this.http.get<{ success: boolean; product: Product }>(
      `${this.apiUrl}/${id}`
    );
  }

  createProduct(
  product: CreateProductRequest
): Observable<{ success: boolean; product: Product }> {

  return this.http.post<{
    success: boolean;
    product: Product;
  }>(
    this.apiUrl,
    product
  );

}

uploadProductImage(
  file: File
): Observable<ProductImageUploadResponse> {

  const formData = new FormData();

  formData.append(
    'image',
    file
  );

  return this.http.post<ProductImageUploadResponse>(
  `${environment.apiUrl}/api/admin/uploads/product-image`,
  formData
);
}

updateProduct(
  id: string,
  product: CreateProductRequest
): Observable<{
  success: boolean;
  message: string;
  product: Product;
}> {
  return this.http.put<{
    success: boolean;
    message: string;
    product: Product;
  }>(
    `${this.apiUrl}/${id}`,
    product
  );
}

deleteProduct(
  id: string
): Observable<{
  success: boolean;
  message: string;
}> {
  return this.http.delete<{
    success: boolean;
    message: string;
  }>(
    `${this.apiUrl}/${id}`
  );
}
  

}