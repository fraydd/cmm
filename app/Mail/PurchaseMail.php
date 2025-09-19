<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;

class PurchaseMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public $invoiceData;
    public $pdf;

    /**
     * @param array $invoiceData
     * @param \Illuminate\Mail\Attachment|string|null $pdf
     */
    public function __construct($invoiceData, $pdf)
    {
        $this->invoiceData = $invoiceData;
        $this->pdf = $pdf;
    }

    /**
     * Get the message envelope.
     *
     * @return \Illuminate\Mail\Mailables\Envelope
     */
    public function envelope()
    {
        return new Envelope(
            subject: 'Confirmación de compra y factura',
        );
    }

    /**
     * Get the message content definition.
     *
     * @return \Illuminate\Mail\Mailables\Content
     */
    public function content()
    {
        return new Content(
            view: 'emails.purchase',
            with: [
                'invoiceData' => $this->invoiceData,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array
     */
    public function attachments()
    {
        if ($this->pdf) {
            return [
                Attachment::fromData(fn () => $this->pdf->output(), 'Factura.pdf')
                    ->withMime('application/pdf'),
            ];
        }
        return [];
    }
}
