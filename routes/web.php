<?php

use App\Http\Controllers\Admin\CashRegisterController;
use App\Http\Controllers\Admin\CashMovementsController;
use App\Http\Controllers\Admin\InvoicesController;
use App\Http\Controllers\Admin\StoreAdminController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Admin\ModeloController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Controller;
use \App\Http\Controllers\Admin\BranchesController;
use \App\Http\Controllers\Admin\DashboardController;
use \App\Http\Controllers\Admin\EmployeeController;
use \App\Http\Controllers\Admin\InvitationController;
use \App\Http\Controllers\Admin\PermissionController;
use \App\Http\Controllers\Admin\StoreController;
use \App\Http\Controllers\Admin\AttendanceController;
use \App\Http\Controllers\Admin\CheckinController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// ============================================================================
// RUTAS PÚBLICAS
// ============================================================================

// Ruta principal para marketing
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'error' => session('error')
    ]); 
})->name('welcome');

// Ruta para servir el logo
Route::get('/admin/logo.png', function () {
    $logoPath = storage_path('img/logo.png');
    if (file_exists($logoPath)) {
        return response()->file($logoPath, [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'public, max-age=86400' 
        ]);
    }
    abort(404);
})->name('admin.logo');

// ============================================================================
// RUTAS DE AUTENTICACIÓN
// ============================================================================

// Login
Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
Route::post('/auth/login', [AuthController::class, 'login'])->name('auth.login');

// Logout
Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
Route::get('/logout', [AuthController::class, 'logout'])->name('logout'); // Ruta GET temporal para logout

// Registro
Route::get('/register', [RegisterController::class, 'showRegistrationForm'])->name('register');
Route::post('/auth/register', [RegisterController::class, 'register'])->name('auth.register');

// ============================================================================
// RUTAS DEL PANEL DE ADMINISTRACIÓN
// ============================================================================

Route::prefix('admin')->name('admin.')->middleware(['auth'])->group(function () {

    // ------------------------------------------------------------------------
    // DASHBOARD
    // ------------------------------------------------------------------------
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // ------------------------------------------------------------------------
    // UTILIDADES GENERALES (Solo requieren autenticación)
    // ------------------------------------------------------------------------
    Route::get('/branches', function() {
        $userId = auth()->id();
        return response()->json(Controller::getBranches($userId));
    });

    // ------------------------------------------------------------------------
    // SEDES/BRANCHES
    // ------------------------------------------------------------------------
    // Grupo solo para ver sedes
    Route::middleware(['permission:ver_sedes'])->prefix('sedes')->group(function () {
        Route::get('/', [BranchesController::class, 'index'])->name('sedes.index');
        Route::get('/search-managers', [BranchesController::class, 'searchManagers'])->name('sedes.search-managers');
    });

    // Grupo para editar sedes
    Route::middleware(['permission:editar_sedes'])->prefix('sedes')->group(function () {
        Route::post('/', [BranchesController::class, 'store'])->name('sedes.store');
        Route::put('/{id}', [BranchesController::class, 'update'])->name('sedes.update');
    });

    // ------------------------------------------------------------------------
    // MODELOS
    // ------------------------------------------------------------------------
    // Endpoint para catálogos de modelos (selectores dinámicos) - solo requiere autenticación

    // Rutas para el controlador de Modelos (requieren permiso)
    // Rutas solo para ver modelos
    Route::middleware(['permission:ver_modelos'])->group(function () {
        Route::get('modelos', [ModeloController::class, 'index'])->name('modelos.index');
        Route::get('modelos/{id}', [ModeloController::class, 'show'])->name('modelos.show');
        Route::get('modelos/catalogs', [ModeloController::class, 'catalogs'])->name('modelos.catalogs');
    });

    // Rutas para crear/editar/eliminar modelos
    Route::middleware(['permission:editar_modelos'])->group(function () {
        Route::get('modelos/create', [ModeloController::class, 'create'])->name('modelos.create');
        Route::post('modelos', [ModeloController::class, 'store'])->name('modelos.store');
        Route::get('modelos/{id}/edit', [ModeloController::class, 'edit'])->name('modelos.edit');
        Route::put('modelos/{id}', [ModeloController::class, 'update'])->name('modelos.update');
        Route::patch('modelos/{id}', [ModeloController::class, 'update'])->name('modelos.patch');
        Route::delete('modelos/{id}', [ModeloController::class, 'destroy'])->name('modelos.destroy');
        Route::post('modelos/upload-image', [ModeloController::class, 'uploadImage'])->name('modelos.upload-image');
        Route::post('modelos/upload-pdf', [ModeloController::class, 'uploadPdf'])->name('modelos.upload-pdf');
    });


    // ------------------------------------------------------------------------
    // EMPLEADOS
    // ------------------------------------------------------------------------
    // Grupo solo para ver empleados
    Route::middleware(['permission:ver_empleados'])->group(function () {
        Route::get('empleados/catalogs', [EmployeeController::class, 'catalogs'])->name('empleados.catalogs');
        Route::get('empleados', [EmployeeController::class, 'index'])->name('empleados.index');
        Route::get('empleados/{id}', [EmployeeController::class, 'show'])->name('empleados.show');
    });

    // Grupo para crear/editar/eliminar empleados
    Route::middleware(['permission:editar_empleados'])->group(function () {
        Route::get('empleados/create', [EmployeeController::class, 'create'])->name('empleados.create');
        Route::post('empleados', [EmployeeController::class, 'store'])->name('empleados.store');
        Route::get('empleados/{id}/edit', [EmployeeController::class, 'edit'])->name('empleados.edit');
        Route::put('empleados/{id}', [EmployeeController::class, 'update'])->name('empleados.update');
        Route::patch('empleados/{id}', [EmployeeController::class, 'update'])->name('empleados.patch');
        Route::patch('empleados/{id}/toggle-status', [EmployeeController::class, 'toggleStatus'])->name('empleados.toggle-status');
        Route::delete('empleados/remove-access', [EmployeeController::class, 'removeAccess'])->name('empleados.remove-access');
        Route::delete('empleados/{id}', [EmployeeController::class, 'destroy'])->name('empleados.destroy');
        Route::post('empleados/{id}/assign-branches', [EmployeeController::class, 'assignBranches'])->name('empleados.assign-branches');
    });

    // ------------------------------------------------------------------------
    // INVITACIONES
    // ------------------------------------------------------------------------
    // Ver invitaciones
    Route::middleware(['permission:ver_invitaciones'])->prefix('invitaciones')->group(function () {
        Route::get('/', [InvitationController::class, 'index'])->name('admin.invitaciones.index');
    });

    // Editar invitaciones
    Route::middleware(['permission:editar_invitaciones'])->prefix('invitaciones')->group(function () {
        Route::post('/', [InvitationController::class, 'store'])->name('admin.invitaciones.store');
        Route::post('{invitation}/resend', [InvitationController::class, 'resend'])->name('invitaciones.resend');
        Route::delete('{invitation}/cancel', [InvitationController::class, 'cancel'])->name('invitaciones.cancel');
        Route::delete('/', [InvitationController::class, 'destroy'])->name('admin.invitaciones.destroy');
    });

    // ------------------------------------------------------------------------
    // PERMISOS Y ROLES
    // ------------------------------------------------------------------------
    // Ver roles
    Route::middleware(['permission:ver_roles'])->group(function () {
        Route::get('roles', [PermissionController::class, 'index'])->name('roles.index');
        Route::get('roles/getRoles', [PermissionController::class, 'getRoles'])->name('roles.getRoles');
    });

    // Editar roles
    Route::middleware(['permission:editar_roles'])->group(function () {
        Route::post('roles', [PermissionController::class, 'store'])->name('roles.store');
        Route::put('roles/{id}', [PermissionController::class, 'update'])->name('roles.update');
        Route::delete('roles/{id}', [PermissionController::class, 'destroy'])->name('roles.destroy');
    });

    // ------------------------------------------------------------------------
    // TIENDA - ADMINISTRACIÓN
    // ------------------------------------------------------------------------
    // Ver administración de tienda
    Route::middleware('permission:ver_admin_tienda')->group(function () {
        Route::get('/tienda/surtir', [StoreAdminController::class, 'index'])->name('admin.store.surtir.index');
        Route::post('/tienda/products', [StoreAdminController::class, 'getProducts'])->name('admin.store.products.get');
        Route::post('/tienda/subscriptions', [StoreAdminController::class, 'getSubscriptions'])->name('admin.store.subscriptions.get');
        Route::post('/tienda/events', [StoreAdminController::class, 'getEvents'])->name('admin.store.events.get');
        Route::get('/tienda/categories', [StoreAdminController::class, 'getCategories'])->name('admin.store.categories.get');
    });

    // Editar administración de tienda
    Route::middleware('permission:editar_admin_tienda')->group(function () {
        Route::post('/store/products/upload-image', [StoreAdminController::class, 'uploadProductImage'])->name('admin.store.products.upload.image');
        Route::post('/store/products/update', [StoreAdminController::class, 'updateProduct'])->name('admin.store.products.update');
        Route::post('/store/subscriptions/update', [StoreAdminController::class, 'updateSubscription'])->name('admin.store.subscriptions.update');
        Route::post('/store/events/update', [StoreAdminController::class, 'updateEvent'])->name('admin.store.events.update');
        Route::delete('/store/products/delete', [StoreAdminController::class, 'deleteProduct'])->name('admin.store.products.delete');
        Route::delete('/store/subscriptions/delete', [StoreAdminController::class, 'deleteSubscription'])->name('admin.store.subscriptions.delete');
        Route::delete('/store/events/delete', [StoreAdminController::class, 'deleteEvent'])->name('admin.store.events.delete');
    });

    // ------------------------------------------------------------------------
    // TIENDA - VENTAS
    // ------------------------------------------------------------------------
    // Rutas solo para ver tienda (catálogo, carrito, medios de pago, contar items)
    Route::middleware(['permission:ver_tienda'])->group(function () {
        Route::get('/tienda', [StoreController::class, 'index'])->name('admin.store.index');
        Route::post('/tienda/getCatalog', [StoreController::class, 'getCatalog'])->name('admin.store.getCatalog');
        Route::post('/tienda/getCartItems', [StoreController::class, 'getCartItems'])->name('admin.store.getCartItems');
        Route::post('/tienda/getCartCount', [StoreController::class, 'getCartCount'])->name('admin.store.getCartCount');
        Route::get('/tienda/mediosPago', [StoreController::class, 'mediosPago'])->name('admin.store.mediosPago');
        Route::post('tienda/searchPerson', [StoreController::class, 'searchPerson'])->name('admin.store.searchPerson');
    });

    // Rutas para editar tienda (agregar, editar, eliminar, procesar pago)
    Route::middleware(['permission:editar_tienda'])->group(function () {
        Route::post('/tienda/addToCart', [StoreController::class, 'addToCart'])->name('admin.store.addToCart');
        Route::post('/tienda/removeCartItem', [StoreController::class, 'removeCartItem'])->name('admin.store.removeCartItem');
        Route::post('/tienda/updateCartItem', [StoreController::class, 'updateCartItem'])->name('admin.store.updateCartItem');
        Route::post('/tienda/processPayment', [StoreController::class, 'processPayment'])->name('admin.store.processPayment');
    });

    // ------------------------------------------------------------------------
    // CAJA REGISTRADORA
    // ------------------------------------------------------------------------
    // Rutas solo para ver cajas
    Route::middleware(['permission:ver_cajas'])->group(function () {
        Route::get('cash-register', [CashRegisterController::class, 'index'])->name('admin.cash_register.index');
        Route::post('cash-register/list', [CashRegisterController::class, 'getCashRegisters'])->name('admin.cash_register.list');
    });

    // Rutas para editar cajas
    Route::middleware(['permission:editar_cajas'])->group(function () {
        Route::post('cash-register/open', [CashRegisterController::class, 'open'])->name('admin.cash_register.open');
        Route::post('cash-register/edit', [CashRegisterController::class, 'edit'])->name('admin.cash_register.edit');
    });

    // Obtener caja activa (solo requiere autenticación y verificación)
    Route::middleware(['verified'])->group(function () {
        Route::get('cash-register/getActive/{branch_id}', [CashRegisterController::class, 'getActive'])->name('admin.cash_register.getActive');
    });

    // ------------------------------------------------------------------------
    // MOVIMIENTOS DE CAJA
    // ------------------------------------------------------------------------
    Route::middleware(['permission:ver_cajas'])->group(function () {
        Route::get('cash-movements', [CashMovementsController::class, 'index'])->name('admin.cash_movements.index');
        Route::post('cash-movements/list', [CashMovementsController::class, 'getCashMovements'])->name('admin.cash_movements.list');
        Route::post('cash-movements/createEgreso', [CashMovementsController::class, 'createEgreso'])->name('admin.cash_movements.createEgreso');
        Route::post('cash-movements/edit', [CashMovementsController::class, 'edit'])->name('admin.cash_movements.edit');
    });

    // ------------------------------------------------------------------------
    // FACTURAS
    // ------------------------------------------------------------------------
    // Grupo solo para ver facturas
    Route::middleware(['permission:ver_facturas'])->group(function () {
        Route::get('invoices', [InvoicesController::class, 'index'])->name('admin.invoices.index');
        Route::post('invoices/list', [InvoicesController::class, 'getInvoices'])->name('admin.invoices.list');
        Route::get('invoices/{id}/pdf', [InvoicesController::class, 'downloadPdf'])->name('admin.invoices.pdf');
        Route::get('/invoices/mediosPago', [StoreController::class, 'mediosPago'])->name('admin.store.mediosPago');
    });

    // Grupo para editar facturas
    Route::middleware(['permission:editar_facturas'])->group(function () {
        Route::get('invoices/edit/{id}', [InvoicesController::class, 'Edit'])->name('admin.invoices.edit');
        Route::post('/invoices/createEgreso', [InvoicesController::class, 'createEgreso'])->name('admin.invoices.createEgreso');
        Route::post('/invoices/createPayment', [InvoicesController::class, 'createPayment'])->name('admin.invoices.createPayment');
        Route::put('/invoices/updatePayment/{id}', [InvoicesController::class, 'updatePayment'])->name('admin.invoices.updatePayment');
        Route::put('/invoices/updateInvoice/{id}', [InvoicesController::class, 'updateInvoice'])->name('admin.invoices.updateInvoice');
        Route::delete('/invoices/deletePayment/{id}', [InvoicesController::class, 'deletePayment'])->name('admin.invoices.deletePayment');
    });

    // Búsqueda de personas para facturas
    Route::get('/search/people', [InvoicesController::class, 'searchPeople']);

    // ------------------------------------------------------------------------
    // ASISTENCIAS
    // ------------------------------------------------------------------------
    // Grupo solo para ver asistencias
    Route::middleware(['permission:ver_asistencias'])->group(function () {
        Route::get('asistencias', [AttendanceController::class, 'index'])->name('admin.attendance.index');
        Route::post('asistencias/records', [AttendanceController::class, 'getAttendanceRecords'])->name('admin.attendance.records');
        Route::get('asistencias/{id}', [AttendanceController::class, 'show'])->name('admin.attendance.show');
    });

    // Grupo para editar asistencias
    Route::middleware(['permission:editar_asistencias'])->group(function () {
        Route::post('asistencias', [AttendanceController::class, 'store'])->name('admin.attendance.store');
        Route::put('asistencias/{id}', [AttendanceController::class, 'update'])->name('admin.attendance.update');
        Route::delete('asistencias/{id}', [AttendanceController::class, 'destroy'])->name('admin.attendance.destroy');
    });
        Route::get('asistencias/branches/access', [AttendanceController::class, 'getAccessibleBranches'])->name('admin.attendance.branches.access');

    // ------------------------------------------------------------------------
    // CHECK-IN
    // ------------------------------------------------------------------------
    Route::middleware(['permission:crear_asistencias'])->group(function () {
        Route::get('checkin', [CheckinController::class, 'index'])->name('admin.checkin.index');
        Route::post('checkin', [CheckinController::class, 'store'])->name('admin.checkin.store');
    });

});