#!/usr/bin/env php
<?php

/**
 * Script simple para migrar imágenes de modelos
 * Uso: php migrate_simple.php
 */

// Configuración
$sourceDir = __DIR__ . '/../public/storage/modelos_migrar';
$baseDestDir = __DIR__ . '/../public/storage/modelos';
$logFile = __DIR__ . '/migration_simple_' . date('Y-m-d_H-i-s') . '.log';

// Función para logging
function logMessage($message, $logFile) {
    $timestamp = date('Y-m-d H:i:s');
    $logLine = "[{$timestamp}] {$message}\n";
    file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
    echo $logLine;
}

echo "=== MIGRADOR SIMPLE DE IMÁGENES ===\n";
echo "Origen: {$sourceDir}\n";
echo "Destino base: {$baseDestDir}\n\n";

// Verificar directorio origen
if (!is_dir($sourceDir)) {
    logMessage("ERROR: Directorio origen no existe: {$sourceDir}", $logFile);
    exit(1);
}

// Crear directorio base si no existe
if (!is_dir($baseDestDir)) {
    mkdir($baseDestDir, 0755, true);
    logMessage("Directorio base creado: {$baseDestDir}", $logFile);
}

// Mapeo manual basado en el SQL de migración (extraído del archivo)
$imageMapping = [
    // model_id => file_name
    8 => '20220827094804.jpeg',
    48 => '20220827174133.jpeg',
    76 => '20220903150310.jpeg',
    84 => '20220903170603.jpeg',
    91 => '20220903190422.jpeg',
    99 => '20220910113047.jpeg',
    160 => '20230114180952.jpeg',
    161 => '20230119110551.jpeg',
    164 => '20230120174342.jpeg',
    198 => '20230826192324.jpg',
    210 => '20230330175806.jpeg',
    222 => '20230506110947.jpeg',
    243 => '20230610112342.jpeg',
    265 => '20230708141505.jpeg',
    286 => '20230922171103.jpeg',
    289 => '20231006160124.jpeg',
    290 => '20231006161506.jpeg',
    294 => '20231013162000.jpeg',
    296 => '20231014154543.jpeg',
    298 => '20231021153040.jpeg',
    323 => '20240113114939.jpeg',
    326 => '20240113145253.jpeg',
    327 => '20240113150007.jpeg',
    347 => '20240217173113.jpeg',
    348 => '20240302130416.jpeg',
    356 => '20240323161541.jpeg',
    369 => '20240511140333.jpeg',
    370 => '20240511144939.jpeg',
    371 => '20240518093929.jpeg',
    373 => '20240518141759.jpeg',
    378 => '20240518174921.jpeg',
    382 => '20240608163246.jpeg',
    383 => '20240608164225.jpeg',
    386 => '20240622142032.jpeg',
    392 => '20240727135317.jpeg',
    394 => '20240803161331.jpeg',
    399 => '20240831133609.jpeg',
    402 => '20240907154333.jpeg',
    404 => '20240921114651.jpeg',
    405 => '20240926170514.jpeg',
    406 => '20240926182518.jpeg',
    412 => '20241102142928.jpeg',
    414 => '20241108184452.jpeg',
    417 => '20241114180431.jpeg',
    421 => '20250118120338.jpeg',
    422 => '20250118125845.jpeg',
    424 => '20250118173125.jpeg',
    426 => '20250123194703.jpeg',
    427 => '20250125103835.jpeg',
    429 => '20250125151047.jpeg',
    430 => '20250131180419.jpeg',
    431 => '20250201175934.jpeg',
    432 => '20250206180059.jpeg',
    434 => '20250208102107.jpeg',
    435 => '20250208105444.jpeg',
    436 => '20250208163005.jpeg',
    437 => '20250208164021.jpeg',
    438 => '20250208180157.jpeg',
    439 => '20250222125807.jpeg',
    440 => '20250222145216.jpeg',
    441 => '20250227192411.jpeg',
    442 => '20250228195616.jpeg',
    443 => '20250304151309.jpeg',
    444 => '20250306181713.jpeg',
    445 => '20250307174857.jpeg',
    446 => '20250308130659.jpeg',
    447 => '20250308152219.jpeg',
    448 => '20250308154756.jpeg',
    449 => '20250308175806.jpeg',
    450 => '20250313145903.jpeg',
    451 => '20250313174436.jpeg',
    454 => '20250328173848.jpg',
    455 => '20250404192200.jpg',
    456 => '20250405152208.jpeg',
    457 => '20250412100419.jpeg',
    458 => '20250412150107.jpg',
    460 => '20250419151036.jpeg',
    461 => '20250424173107.jpeg',
    462 => '20250424175330.jpeg',
    463 => '20250425173738.jpeg',
    464 => '20250426094300.jpeg',
    466 => '20250502173937.jpeg',
    467 => '20250503135422.jpeg',
    468 => '20250508181010.jpeg',
    469 => '20250509174558.jpeg',
    470 => '20250509174813.jpg',
    471 => '20250516173652.jpeg',
    472 => '20250516181131.jpeg',
    473 => '20250516182017.jpeg',
    474 => '20250517134158.jpeg',
    475 => '20250531102137.jpeg',
    476 => '20250531150759.jpeg',
    477 => '20250605185343.jpeg',
    478 => '20250606173147.jpeg',
    479 => '20250607122845.jpg',
    480 => '20250607180429.jpeg',
    481 => '20250620194938.jpeg',
    483 => '20250627180732.jpeg',
    484 => '20250627193709.jpeg',
    485 => '20250628121404.jpeg',
    486 => '20250703173603.jpeg',
    487 => '20250705135951.jpeg',
    488 => '20250710171426.jpeg',
    489 => '20250710175908.jpeg',
    490 => '20250712162903.jpeg',
    491 => '20250718165916.jpeg',
    492 => '20250718173216.jpeg',
    493 => '20250718191016.jpeg',
    494 => '20250719103152.jpeg',
    495 => '20250719110110.jpeg',
    496 => '20250719152539.jpeg',
    497 => '20250726122538.jpeg',
    498 => '20250731172330.jpeg',
    499 => '20250731172605.jpg',
    500 => '20250731173826.jpeg',
    501 => '20250731173923.jpg',
    502 => '20250808190250.jpeg',
    503 => '20250809151826.jpg',
    504 => '20250809175819.jpeg',
    505 => '20250821193732.jpg',
    506 => '20250828173734.jpeg',
    507 => '20250830122507.jpeg',
    508 => '20250830150920.jpeg',
    509 => '20250905172627.jpeg',
    510 => '20250905173427.jpeg'
];

$migrated = 0;
$notFound = 0;
$errors = 0;

logMessage("Iniciando migración de " . count($imageMapping) . " imágenes", $logFile);

foreach ($imageMapping as $modelId => $fileName) {
    $sourcePath = $sourceDir . '/' . $fileName;
    $destDir = $baseDestDir . '/' . $modelId;
    $destPath = $destDir . '/' . $fileName;
    
    echo "Procesando modelo {$modelId} - {$fileName}...";
    
    // Verificar si existe el archivo origen
    if (!file_exists($sourcePath)) {
        $notFound++;
        logMessage("NO ENCONTRADO: {$sourcePath}", $logFile);
        echo " ❌ NO ENCONTRADO\n";
        continue;
    }
    
    // Crear directorio del modelo si no existe
    if (!is_dir($destDir)) {
        if (!mkdir($destDir, 0755, true)) {
            $errors++;
            logMessage("ERROR: No se pudo crear directorio {$destDir}", $logFile);
            echo " ❌ ERROR DIRECTORIO\n";
            continue;
        }
    }
    
    // Verificar si ya existe el archivo destino
    if (file_exists($destPath)) {
        logMessage("YA EXISTE: {$destPath}", $logFile);
        echo " ⚠️  YA EXISTE\n";
        continue;
    }
    
    // Copiar archivo
    if (copy($sourcePath, $destPath)) {
        $migrated++;
        logMessage("MIGRADO: {$sourcePath} -> {$destPath}", $logFile);
        echo " ✅ MIGRADO\n";
    } else {
        $errors++;
        logMessage("ERROR COPIANDO: {$sourcePath} -> {$destPath}", $logFile);
        echo " ❌ ERROR\n";
    }
}

echo "\n=== RESUMEN ===\n";
echo "Archivos migrados: {$migrated}\n";
echo "No encontrados: {$notFound}\n";
echo "Errores: {$errors}\n";
echo "Total: " . count($imageMapping) . "\n";

logMessage("=== RESUMEN FINAL ===", $logFile);
logMessage("Migrados: {$migrated}", $logFile);
logMessage("No encontrados: {$notFound}", $logFile);
logMessage("Errores: {$errors}", $logFile);

if ($migrated > 0) {
    echo "\n✅ Migración completada!\n";
    echo "Las imágenes están ahora organizadas en:\n";
    echo "  public/storage/modelos/{ID_MODELO}/{nombre_imagen}\n";
} else {
    echo "\n⚠️  No se migraron archivos. Verifica que existan en modelos_migrar/\n";
}

echo "\nLog guardado en: {$logFile}\n";
