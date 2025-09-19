<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CloseOpenAttendanceRecords extends Command
{
    protected $signature = 'attendance:close-open';
    protected $description = 'Cierra todos los registros de asistencia abiertos al final del día (is_closed = false y check_out IS NULL)';

    public function handle()
    {
        $count = DB::table('attendance_records')
            ->where('is_closed', false)
            ->whereNull('check_out')
            ->update([
                'is_closed' => true,
                'updated_at' => now(),
            ]);
        $this->info("Registros de asistencia cerrados automáticamente: {$count}");
    }
} 