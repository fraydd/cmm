<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('token')->unique();
            $table->enum('status', ['pending', 'accepted', 'expired'])->default('pending');
            $table->timestamp('expires_at');
            $table->unsignedBigInteger('invited_by')->nullable();
            $table->unsignedBigInteger('accepted_by')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            // Índices
            $table->index(['email', 'status']);
            $table->index(['token', 'status']);
            $table->index('expires_at');

            // Foreign keys
            $table->foreign('invited_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('accepted_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('invitations');
    }
};
