import { Component, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl,FormGroup,ReactiveFormsModule,Validators} from '@angular/forms';
import {CreateProductRequest,Product,ProductService} from '../../services/product';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-admin-products',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.css'
})
export class AdminProducts implements OnInit {

  products = signal<Product[]>([]);
  loading = signal(true);
  submitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  selectedImage = signal<File | null>(null);
  imagePreview = signal<string>('');
  uploadingImage = signal(false);
  uploadedImageUrl = signal('');
  uploadedImagePublicId = signal('');

  editingProductId = signal<string | null>(null);
  deletingProductId = signal<string | null>(null);

  productForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2)
      ]
    }),

    category: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required
      ]
    }),

    description: new FormControl('', {
      nonNullable: true
    }),

    price: new FormControl(0, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(0)
      ]
    }),

    unit: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required
      ]
    }),

    imageUrl: new FormControl('', {
      nonNullable: true
    }),

    stock: new FormControl(0, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(0)
      ]
    }),

    isAvailable: new FormControl(true, {
      nonNullable: true
    })

  });

  constructor(
    private productService: ProductService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {

    this.loadProducts();

  }

loadProducts(): void {

    this.loading.set(true);

    this.productService
      .getProducts()
      .subscribe({

        next: (response) => {

          this.products.set(
            response.products
          );

          this.loading.set(false);

        },

        error: (error) => {

          console.error(
            'ADMIN PRODUCTS ERROR:',
            error
          );

          this.errorMessage.set(
            'Unable to load products.'
          );

          this.loading.set(false);

        }

      });

  }

 createProduct(): void {

  if (this.submitting()) {
    return;
  }

  if (this.productForm.invalid) {
    this.productForm.markAllAsTouched();

    return;
  }

  if (!this.uploadedImageUrl()) {
    this.errorMessage.set(
      'Please upload a product image first.'
    );

    return;
  }

  this.submitting.set(true);
  this.errorMessage.set('');

  const product: CreateProductRequest = {
    name: this.productForm.controls.name.value,
    category: this.productForm.controls.category.value,
    description: this.productForm.controls.description.value,
    price: this.productForm.controls.price.value,
    unit: this.productForm.controls.unit.value,
    imageUrl: this.uploadedImageUrl(),
    imagePublicId: this.uploadedImagePublicId(),
    stock: this.productForm.controls.stock.value,
    isAvailable:
      this.productForm.controls.isAvailable.value
  };

  const editingId = this.editingProductId();

  if (editingId) {

    this.productService
      .updateProduct(
        editingId,
        product
      )
      .subscribe({

        next: (response) => {

          this.toastService.show(
            'Product updated successfully.'
          );

          this.submitting.set(false);

          this.editingProductId.set(null);

          this.resetForm();

          this.loadProducts();
        },

        error: (error) => {

          this.toastService.show(
            'Failed to Update Product, Try sometime later','error'
          );

          console.error(
            'UPDATE PRODUCT ERROR:',
            error
          );

          this.submitting.set(false);

          this.errorMessage.set(
            error?.error?.message ||
            'Unable to update product.'
          );
        }

      });

  } else {

    this.productService
      .createProduct(product)
      .subscribe({

        next: (response) => {

          this.toastService.show(
            'Product created successfully.'
          );

          this.submitting.set(false);

          this.resetForm();

          this.loadProducts();
        },

        error: (error) => {

          this.toastService.show(
            'Failed to Create Product, Try sometime later','error'
          );

          console.error(
            'CREATE PRODUCT ERROR:',
            error
          );

          this.submitting.set(false);

          this.errorMessage.set(
            error?.error?.message ||
            'Unable to create product.'
          );
        }

      });
  }
}

resetForm(): void {

    this.productForm.reset({
        name: '',
        category: '',
        description: '',
        price: 0,
        unit: '',
        stock: 0,
        isAvailable: true
    });

    this.selectedImage.set(null);
    this.imagePreview.set('');
    this.uploadedImageUrl.set('');
    this.uploadedImagePublicId.set('');

    this.editingProductId.set(null);
}

 onImageSelected(
  event: Event
): void {

  const input =
    event.target as HTMLInputElement;

  if (!input.files || input.files.length === 0) {
    return;
  }

  const file = input.files[0];

  this.selectedImage.set(file);

  const previewUrl =
    URL.createObjectURL(file);

  this.imagePreview.set(previewUrl);

  this.uploadedImageUrl.set('');
  this.uploadedImagePublicId.set('');
}

uploadImage(): void {

  if (this.uploadingImage()) {
    return;
  }

  const file = this.selectedImage();

  if (!file) {
    this.errorMessage.set(
      'Please select an image first.'
    );

    return;
  }

  this.uploadingImage.set(true);
  this.errorMessage.set('');

  this.productService
    .uploadProductImage(file)
    .subscribe({

      next: (response) => {

        this.uploadedImageUrl.set(
          response.imageUrl
        );

        this.uploadedImagePublicId.set(
          response.imagePublicId
        );

        this.uploadingImage.set(false);

        this.toastService.show(
          'Image uploaded successfully.'
        );
      },

      error: (error) => {

        this.toastService.show(
            'Failed to Upload Image, Try sometime later','error'
          );

        console.error(
          'IMAGE UPLOAD ERROR:',
          error
        );

        this.uploadingImage.set(false);

        this.errorMessage.set(
          error?.error?.message ||
          'Unable to upload image.'
        );
      }

    });
}

editProduct(product: Product): void {
    this.editingProductId.set(product._id);

    this.productForm.patchValue({
        name: product.name,
        category: product.category,
        description: product.description,
        price: product.price,
        unit: product.unit,
        stock: product.stock,
        isAvailable: product.isAvailable
    });

    this.selectedImage.set(null);

    this.imagePreview.set(
        product.imageUrl || ''
    );

    this.uploadedImageUrl.set(
        product.imageUrl || ''
    );

    this.uploadedImagePublicId.set(
        product.imagePublicId || ''
    );

    this.errorMessage.set('');
    

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

cancelEdit(): void {
    this.editingProductId.set(null);

    this.productForm.reset({
        name: '',
        category: '',
        description: '',
        price: 0,
        unit: '',
        stock: 0,
        isAvailable: true
    });

    this.selectedImage.set(null);
    this.imagePreview.set('');
    this.uploadedImageUrl.set('');
    this.uploadedImagePublicId.set('');

    this.errorMessage.set('');
    
}

deleteProduct(product: Product): void {

  if (this.deletingProductId()) {
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to delete "${product.name}"?`
  );

  if (!confirmed) {
    return;
  }

  this.errorMessage.set('');

  this.deletingProductId.set(
    product._id
  );

  this.productService
    .deleteProduct(product._id)
    .subscribe({

      next: (response) => {

        this.toastService.show(
          'Product deleted successfully.'
        );

        this.deletingProductId.set(null);

        this.loadProducts();
      },

      error: (error) => {

        this.toastService.show(
            'Failed to Delete Product, Try sometime later','error'
          );

        console.error(
          'DELETE PRODUCT ERROR:',
          error
        );

        this.deletingProductId.set(null);

        this.errorMessage.set(
          error?.error?.message ||
          'Unable to delete product.'
        );
      }

    });
}



}