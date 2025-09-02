<?php

use App\Http\Controllers\Admin\CashRegisterController;
use App\Http\Controllers\Admin\CashMovementsController;
use App\Http\Controllers\Admin\InvoicesController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Admin\ModeloController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\EmployeeController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\InvitationController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Auth\RegisterController;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;

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

// Ruta principal para marketing
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'error' => session('error')
    ]);
})->name('welcome');

// Rutas de autenticación
Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
Route::post('/auth/login', [AuthController::class, 'login'])->name('auth.login');
Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
Route::get('/logout', [AuthController::class, 'logout'])->name('logout'); // Ruta GET temporal para logout

// Ruta para servir el logo
Route::get('/admin/logo.png', function () {
    $logoPath = storage_path('img/logo.png');
    if (file_exists($logoPath)) {
        return response()->file($logoPath, [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'public, max-age=86400' // Cache por 1 día
        ]);
    }
    abort(404);
})->name('admin.logo');

// Rutas de registro
Route::get('/register', [RegisterController::class, 'showRegistrationForm'])->name('register');
Route::post('/auth/register', [RegisterController::class, 'register'])->name('auth.register');


// Rutas del panel de administración
Route::prefix('admin')->name('admin.')->middleware(['auth'])->group(function () {
    // Dashboard
    Route::get('/', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');

    // Endpoint para catálogos de modelos (selectores dinámicos) - solo requiere autenticación
    Route::get('modelos/catalogs', [ModeloController::class, 'catalogs'])->name('modelos.catalogs');

    // Rutas para el controlador de Modelos (requieren permiso)
    Route::middleware(['permission:view_modelos'])->group(function () {
        Route::resource('modelos', ModeloController::class);
        Route::post('modelos/upload-image', [ModeloController::class, 'uploadImage'])->name('modelos.upload-image');
        Route::post('modelos/upload-pdf', [ModeloController::class, 'uploadPdf'])->name('modelos.upload-pdf');

    });

    // Rutas para el controlador de Empleados con permisos específicos
    // Catálogos - solo requiere autenticación
    Route::get('empleados/catalogs', [\App\Http\Controllers\Admin\EmployeeController::class, 'catalogs'])->name('empleados.catalogs')->middleware('auth');
    
    // Rutas de visualización
    Route::middleware(['permission:view_employees'])->group(function () {
        Route::get('empleados', [\App\Http\Controllers\Admin\EmployeeController::class, 'index'])->name('empleados.index');
        Route::get('empleados/{id}', [\App\Http\Controllers\Admin\EmployeeController::class, 'show'])->name('empleados.show');
    });
    
    // Rutas de creación
    Route::middleware(['permission:create_employees'])->group(function () {
        Route::get('empleados/create', [\App\Http\Controllers\Admin\EmployeeController::class, 'create'])->name('empleados.create');
        Route::post('empleados', [\App\Http\Controllers\Admin\EmployeeController::class, 'store'])->name('empleados.store');
    });
    
    // Rutas de edición
    Route::middleware(['permission:edit_employees'])->group(function () {
        Route::get('empleados/{id}/edit', [\App\Http\Controllers\Admin\EmployeeController::class, 'edit'])->name('empleados.edit');
        Route::put('empleados/{id}', [\App\Http\Controllers\Admin\EmployeeController::class, 'update'])->name('empleados.update');
        Route::patch('empleados/{id}', [\App\Http\Controllers\Admin\EmployeeController::class, 'update'])->name('empleados.patch');
        Route::patch('empleados/{id}/toggle-status', [\App\Http\Controllers\Admin\EmployeeController::class, 'toggleStatus'])->name('empleados.toggle-status');
    });
    
    // Rutas de eliminación
    Route::middleware(['permission:delete_employees'])->group(function () {
        Route::delete('empleados/remove-access', [\App\Http\Controllers\Admin\EmployeeController::class, 'removeAccess'])->name('empleados.remove-access');
        Route::delete('empleados/{id}', [\App\Http\Controllers\Admin\EmployeeController::class, 'destroy'])->name('empleados.destroy');
    });
    
    // Rutas de asignación de sedes
    Route::middleware(['permission:assign_employee_branches'])->group(function () {
        Route::post('empleados/{id}/assign-branches', [\App\Http\Controllers\Admin\EmployeeController::class, 'assignBranches'])->name('empleados.assign-branches');
    });

    // Rutas para el controlador de Invitaciones (solo admin)
    Route::middleware(['permission:view_invitations'])->get('invitaciones', [\App\Http\Controllers\Admin\InvitationController::class, 'index'])->name('admin.invitaciones.index');
    Route::middleware(['permission:delete_invitations'])->delete('invitaciones', [\App\Http\Controllers\Admin\InvitationController::class, 'destroy'])->name('admin.invitaciones.destroy');
    Route::middleware(['permission:resend_invitations'])->post('invitaciones/{invitation}/resend', [\App\Http\Controllers\Admin\InvitationController::class, 'resend'])->name('invitaciones.resend');
    Route::middleware(['permission:cancel_invitations'])->delete('invitaciones/{invitation}/cancel', [\App\Http\Controllers\Admin\InvitationController::class, 'cancel'])->name('invitaciones.cancel');
    Route::middleware(['permission:create_invitations'])->post('invitaciones', [\App\Http\Controllers\Admin\InvitationController::class, 'store'])->name('admin.invitaciones.store');
    
    
    Route::middleware(['auth', 'permission:view_permissions'])->group(function () {
        Route::get('permisos/get-permissions', [\App\Http\Controllers\Admin\PermissionController::class, 'getPermissions'])->name('permisos.get-permissions');
        Route::resource('permisos', \App\Http\Controllers\Admin\PermissionController::class);
    });
    
    // Rutas para roles
    Route::middleware(['auth', 'permission:view_permissions'])->group(function () {
        Route::post('roles', [\App\Http\Controllers\Admin\PermissionController::class, 'store'])->name('roles.store');
        Route::put('roles/{id}', [\App\Http\Controllers\Admin\PermissionController::class, 'update'])->name('roles.update');
        Route::delete('roles/{id}', [\App\Http\Controllers\Admin\PermissionController::class, 'destroy'])->name('roles.destroy');
    });

    
    Route::middleware(['auth'])->group(function () {
        Route::get('/branches', function() {
            $userId = auth()->id();
            return response()->json(Controller::getBranches($userId));
        });
    });
});

// Rutas de asistencias (admin)
Route::prefix('admin')->middleware(['auth', 'verified'])->group(function () {
    Route::get('asistencias', [\App\Http\Controllers\Admin\AttendanceController::class, 'index'])
        ->name('admin.attendance.index')
        ->middleware('can:view_attendance');
    Route::post('asistencias/records', [\App\Http\Controllers\Admin\AttendanceController::class, 'getAttendanceRecords'])
        ->name('admin.attendance.records')
        ->middleware('can:view_attendance');
    Route::get('asistencias/{id}', [\App\Http\Controllers\Admin\AttendanceController::class, 'show'])
        ->name('admin.attendance.show')
        ->middleware('can:view_attendance');
    Route::post('asistencias', [\App\Http\Controllers\Admin\AttendanceController::class, 'store'])
        ->name('admin.attendance.store')
        ->middleware('can:create_attendance');
    Route::put('asistencias/{id}', [\App\Http\Controllers\Admin\AttendanceController::class, 'update'])
        ->name('admin.attendance.update')
        ->middleware('can:edit_attendance');
    Route::delete('asistencias/{id}', [\App\Http\Controllers\Admin\AttendanceController::class, 'destroy'])
        ->name('admin.attendance.destroy')
        ->middleware('can:delete_attendance');
    Route::get('asistencias/branches/access', [\App\Http\Controllers\Admin\AttendanceController::class, 'getAccessibleBranches'])
        ->name('admin.attendance.branches.access');
});

// Rutas de checkin (admin)
Route::prefix('admin')->middleware(['auth', 'verified'])->group(function () {
    Route::get('checkin', [\App\Http\Controllers\Admin\CheckinController::class, 'index'])->name('admin.checkin.index');
    Route::post('checkin', [\App\Http\Controllers\Admin\CheckinController::class, 'store'])->name('admin.checkin.store');
});


// Rutas protegidas de la tienda (ahora bajo /admin/tienda)
Route::prefix('admin')->middleware(['auth', 'permission:ver_tienda'])->group(function () {
    Route::get('/tienda', [\App\Http\Controllers\Admin\StoreController::class, 'index'])->name('admin.store.index');
    Route::post('/tienda/getCatalog', [\App\Http\Controllers\Admin\StoreController::class, 'getCatalog'])->name('admin.store.getCatalog');
    Route::post('/tienda/addToCart', [\App\Http\Controllers\Admin\StoreController::class, 'addToCart'])->name('admin.store.addToCart');
    Route::post('/tienda/getCartItems', [\App\Http\Controllers\Admin\StoreController::class, 'getCartItems'])->name('admin.store.getCartItems');
    Route::post('/tienda/getCartCount', [\App\Http\Controllers\Admin\StoreController::class, 'getCartCount'])->name('admin.store.getCartCount');
    Route::post('/tienda/removeCartItem', [\App\Http\Controllers\Admin\StoreController::class, 'removeCartItem'])->name('admin.store.removeCartItem');
    Route::post('/tienda/updateCartItem', [\App\Http\Controllers\Admin\StoreController::class, 'updateCartItem'])->name('admin.store.updateCartItem');
    Route::post('/tienda/processPayment', [\App\Http\Controllers\Admin\StoreController::class, 'processPayment'])->name('admin.store.processPayment');
    Route::get('/tienda/mediosPago', [\App\Http\Controllers\Admin\StoreController::class, 'mediosPago'])->name('admin.store.mediosPago');
});

Route::post('admin/tienda/searchPerson', [\App\Http\Controllers\Admin\StoreController::class, 'searchPerson'])
    ->middleware('auth')
    ->name('admin.store.searchPerson');


Route::prefix('admin')->middleware(['auth', 'permission:view_cash_registers'])->group(function () {
    Route::get('cash-register', [CashRegisterController::class, 'index'])->name('admin.cash_register.index');
    Route::post('cash-register/list', [CashRegisterController::class, 'getCashRegisters'])->name('admin.cash_register.list');
    Route::post('cash-register/open', [CashRegisterController::class, 'open'])->name('admin.cash_register.open');
    Route::post('cash-register/edit', [CashRegisterController::class, 'edit'])->name('admin.cash_register.edit');
});

Route::prefix('admin')->middleware(['auth', 'verified'])->group(function () {
    Route::get('cash-register/getActive/{branch_id}', [CashRegisterController::class, 'getActive'])->name('admin.cash_register.getActive');
});

Route::prefix('admin')->middleware(['auth', 'permission:view_cash_movements'])->group(function () {
    Route::get('cash-movements', [CashMovementsController::class, 'index'])->name('admin.cash_movements.index');
    Route::post('cash-movements/list', [CashMovementsController::class, 'getCashMovements'])->name('admin.cash_movements.list');
    Route::post('cash-movements/createEgreso', [CashMovementsController::class, 'createEgreso'])->name('admin.cash_movements.createEgreso');
    Route::post('cash-movements/edit', [CashMovementsController::class, 'edit'])->name('admin.cash_movements.edit');
});

Route::prefix('admin')->middleware(['auth', 'permission:view_invoices'])->group(function () {
    Route::get('invoices', [InvoicesController::class, 'index'])->name('admin.invoices.index');
    Route::post('invoices/list', [InvoicesController::class, 'getInvoices'])->name('admin.invoices.list');
    Route::get('invoices/{id}/pdf', [InvoicesController::class, 'downloadPdf'])->name('admin.invoices.pdf');
    Route::get('invoices/edit/{id}', [InvoicesController::class, 'Edit'])->name('admin.invoices.edit');
    Route::get('/invoices/mediosPago', [\App\Http\Controllers\Admin\StoreController::class, 'mediosPago'])->name('admin.store.mediosPago');
    Route::post('/invoices/createPayment', [InvoicesController::class, 'createPayment'])->name('admin.invoices.createPayment');
    Route::put('/invoices/updatePayment/{id}', [InvoicesController::class, 'updatePayment'])->name('admin.invoices.updatePayment');
    Route::put('/invoices/updateInvoice/{id}', [InvoicesController::class, 'updateInvoice'])->name('admin.invoices.updateInvoice');
    Route::delete('/invoices/deletePayment/{id}', [InvoicesController::class, 'deletePayment'])->name('admin.invoices.deletePayment');

    // Route::post('cash-movements/createEgreso', [CashMovementsController::class, 'createEgreso'])->name('admin.cash_movements.createEgreso');
    // Route::post('cash-movements/edit', [CashMovementsController::class, 'edit'])->name('admin.cash_movements.edit');
});