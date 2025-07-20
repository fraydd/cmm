<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Admin\ModeloController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\InvitationController;
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
    });

    // Rutas para el controlador de Invitaciones (solo admin)
    Route::middleware(['permission:view_invitations'])->get('invitaciones', [\App\Http\Controllers\Admin\InvitationController::class, 'index'])->name('admin.invitaciones.index');
    Route::middleware(['permission:delete_invitations'])->delete('invitaciones', [\App\Http\Controllers\Admin\InvitationController::class, 'destroy'])->name('admin.invitaciones.destroy');
    Route::middleware(['permission:resend_invitations'])->post('invitaciones/{invitation}/resend', [\App\Http\Controllers\Admin\InvitationController::class, 'resend'])->name('invitaciones.resend');
    Route::middleware(['permission:cancel_invitations'])->delete('invitaciones/{invitation}/cancel', [\App\Http\Controllers\Admin\InvitationController::class, 'cancel'])->name('invitaciones.cancel');
    Route::middleware(['permission:create_invitations'])->post('invitaciones', [\App\Http\Controllers\Admin\InvitationController::class, 'store'])->name('admin.invitaciones.store');
    Route::middleware(['auth'])->group(function () {
        Route::get('/branches/list', function() {
            return response()->json(Controller::getBranches());
        });
    });
});

// Rutas de asistencias (admin)
Route::prefix('admin')->middleware(['auth', 'verified'])->group(function () {
    Route::get('asistencias', [\App\Http\Controllers\Admin\AttendanceController::class, 'index'])
        ->name('admin.attendance.index')
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
});
