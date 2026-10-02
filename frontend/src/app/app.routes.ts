import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { ProductDetails } from './pages/product-details/product-details';
import { Cart } from './pages/cart/cart';
import { Order } from './pages/order/order';
import { Orders } from './pages/orders/orders';
import { Login } from './components/login/login';

import { AdminLayout } from './components/admin-layout/admin-layout';
import { AdminOrders } from './pages/admin-orders/admin-orders';
import { AdminProducts } from './pages/admin-products/admin-products';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { PaymentSuccess } from './pages/payment-success/payment-success';

export const routes: Routes = [

/* ================================
Customer
================================= */

{
path: '',
component: Home
},

{
path: 'product/:id',
component: ProductDetails
},

{
path: 'cart',
component: Cart
},

{
path: 'order',
component: Order,
canActivate: [authGuard]
},

{
path: 'orders',
component: Orders,
canActivate: [authGuard]
},

{
path: 'login',
component: Login
},
{
  path: 'payment-success',
  component: PaymentSuccess,
  canActivate: [authGuard]
},

/* ================================
Admin
================================= */

{
path: 'admin',


component: AdminLayout,

canActivate: [adminGuard],

children: [
  {
    path: '',
    component: AdminDashboard
  },
  {
    path: 'orders',
    component: AdminOrders
  },
  {
    path: 'products',
    component: AdminProducts
  }
]


},


];
