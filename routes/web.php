<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ModeloController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\InvitationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Auth\RegisterController;

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
    return Inertia::render('Welcome');
})->name('welcome');

// Rutas de autenticación
Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
Route::post('/auth/login', [AuthController::class, 'login'])->name('auth.login');
Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
Route::get('/logout', [AuthController::class, 'logout'])->name('logout'); // Ruta GET temporal para logout

// Rutas de registro
Route::get('/register', [RegisterController::class, 'showRegistrationForm'])->name('register');
Route::post('/auth/register', [RegisterController::class, 'register'])->name('auth.register');


// Rutas del panel de administración
Route::prefix('admin')->name('admin.')->middleware(['auth'])->group(function () {
    // Dashboard
    Route::get('/', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');
    
    // Rutas para el controlador de Modelos (todos los usuarios autenticados)
    Route::middleware(['permission:view_modelos'])->group(function () {
    Route::resource('modelos', ModeloController::class);
    });
    
    // Rutas para el controlador de Invitaciones (solo admin)
    Route::middleware(['permission:view_invitations'])->group(function () {
        Route::resource('invitaciones', \App\Http\Controllers\Admin\InvitationController::class);
        Route::post('/invitaciones/{invitation}/resend', [\App\Http\Controllers\Admin\InvitationController::class, 'resend'])->name('invitaciones.resend');
        Route::delete('/invitaciones/{invitation}/cancel', [\App\Http\Controllers\Admin\InvitationController::class, 'cancel'])->name('invitaciones.cancel');
        
        // Ruta de prueba temporal
        Route::post('/test-invitation', [\App\Http\Controllers\Admin\InvitationController::class, 'store'])->name('test.invitation');
    });
    
    // Futuras rutas para otros controladores
    // Route::resource('caja', CajaController::class);
    // Route::resource('academia', AcademiaController::class);
});
