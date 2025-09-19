<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class CleanTempModelImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'modelos:clean-temp-images';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Elimina imágenes temporales de modelos con más de 24 horas de antigüedad';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tempPath = storage_path('app/temp/modelos');
        $now = time();
        $deleted = 0;

        if (!file_exists($tempPath)) {
            $this->info('No existe el directorio temporal.');
            return 0;
        }

        $files = File::files($tempPath);
        foreach ($files as $file) {
            if ($now - $file->getMTime() > 24 * 3600) {
                File::delete($file->getRealPath());
                $deleted++;
            }
        }

        $this->info("Imágenes temporales eliminadas: $deleted");
        return 0;
    }
} 