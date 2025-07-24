#!/bin/bash
# bash database/queries/run_all_queries.sh
# Script para ejecutar todos los archivos .sql de la carpeta en orden alfabético
# Credenciales hardcodeadas (NO pedir por consola)

MYSQL_HOST="127.0.0.1"
MYSQL_PORT=3306
MYSQL_USER="cmm_user"
MYSQL_PWD="cmm_password"
MYSQL_DB="cmm_db"

cd "$(dirname "$0")"

echo "Eliminando todas las tablas de la base de datos $MYSQL_DB..."
mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PWD" "$MYSQL_DB" -e 'SET FOREIGN_KEY_CHECKS = 0; SET GROUP_CONCAT_MAX_LEN=32768; SET @tables = NULL; SELECT GROUP_CONCAT(CONCAT("`", table_name, "`")) INTO @tables FROM information_schema.tables WHERE table_schema = (SELECT DATABASE()); SET @tables = IFNULL(@tables, "dummy"); SET @sql = CONCAT("DROP TABLE IF EXISTS ", @tables); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt; SET FOREIGN_KEY_CHECKS = 1;'


echo "Ejecutando scripts SQL en orden alfabético en $MYSQL_DB@$MYSQL_HOST:$MYSQL_PORT ..."

for sqlfile in $(ls *.sql | sort); do
    echo "Ejecutando $sqlfile ..."
    mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PWD" "$MYSQL_DB" < "$sqlfile"
    if [ $? -ne 0 ]; then
        echo "Error ejecutando $sqlfile. Deteniendo el proceso."
        exit 1
    fi
    echo "$sqlfile ejecutado correctamente."
done

echo "Todos los scripts ejecutados correctamente." 