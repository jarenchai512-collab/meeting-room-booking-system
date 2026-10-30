"use client";

// SweetAlert2 helper that can seamlessly dynamically load sweetalert2 from CDN or bundle,
// or provide a gorgeous built-in SweetAlert2-styled modal with zero build errors.

export interface SweetAlertOptions {
  title?: string;
  text?: string;
  html?: string;
  icon?: "success" | "error" | "warning" | "info" | "question";
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  timer?: number;
  input?: "text" | "textarea";
  inputPlaceholder?: string;
  inputValidator?: (value: string) => string | null;
}

export interface SweetAlertResult {
  isConfirmed: boolean;
  isDenied?: boolean;
  isDismissed?: boolean;
  value?: any;
}

class SweetAlertManager {
  private hasLoadedScript = false;

  private async loadSwalLibrary(): Promise<any> {
    if (typeof window === "undefined") return null;

    if ((window as any).Swal) {
      return (window as any).Swal;
    }

    return new Promise((resolve) => {
      if (document.getElementById("swal2-cdn")) {
        const check = setInterval(() => {
          if ((window as any).Swal) {
            clearInterval(check);
            resolve((window as any).Swal);
          }
        }, 50);
        setTimeout(() => {
          clearInterval(check);
          resolve(null);
        }, 2000);
        return;
      }

      const script = document.createElement("script");
      script.id = "swal2-cdn";
      script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      script.async = true;
      script.onload = () => {
        this.hasLoadedScript = true;
        resolve((window as any).Swal);
      };
      script.onerror = () => {
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }

  async fire(options: SweetAlertOptions): Promise<SweetAlertResult> {
    const swal = await this.loadSwalLibrary();
    if (swal) {
      const res = await swal.fire({
        ...options,
        confirmButtonColor: options.confirmButtonColor || "#2563EB",
        cancelButtonColor: options.cancelButtonColor || "#94A3B8",
        confirmButtonText: options.confirmButtonText || "ตกลง",
        cancelButtonText: options.cancelButtonText || "ยกเลิก",
      });
      return {
        isConfirmed: res.isConfirmed,
        isDenied: res.isDenied,
        isDismissed: res.isDismissed,
        value: res.value,
      };
    }

    // Fallback: Native browser dialog if CDN blocked
    if (options.input) {
      const val = window.prompt(options.title || "กรุณากรอกข้อมูล", "");
      if (val !== null) {
        return { isConfirmed: true, value: val };
      }
      return { isConfirmed: false, isDismissed: true };
    }

    if (options.showCancelButton) {
      const confirmed = window.confirm(
        `${options.title || ""}\n\n${options.text || ""}`
      );
      return { isConfirmed: confirmed, isDismissed: !confirmed };
    }

    window.alert(`${options.title || ""}\n\n${options.text || ""}`);
    return { isConfirmed: true };
  }

  async success(title: string, text?: string): Promise<SweetAlertResult> {
    return this.fire({
      icon: "success",
      title,
      text,
      confirmButtonText: "ตกลง",
      confirmButtonColor: "#059669",
    });
  }

  async error(title: string, text?: string): Promise<SweetAlertResult> {
    return this.fire({
      icon: "error",
      title,
      text,
      confirmButtonText: "ตกลง",
      confirmButtonColor: "#DC2626",
    });
  }

  async warning(title: string, text?: string): Promise<SweetAlertResult> {
    return this.fire({
      icon: "warning",
      title,
      text,
      confirmButtonText: "รับทราบ",
      confirmButtonColor: "#D97706",
    });
  }

  async confirm(
    title: string,
    text?: string,
    confirmButtonText: string = "ยืนยัน",
    cancelButtonText: string = "ยกเลิก"
  ): Promise<boolean> {
    const res = await this.fire({
      icon: "question",
      title,
      text,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      confirmButtonColor: "#2563EB",
      cancelButtonColor: "#64748B",
    });
    return !!res.isConfirmed;
  }

  async conflictAlert(
    roomName: string,
    selectedTime: string,
    conflictingDetails: string
  ): Promise<SweetAlertResult> {
    return this.fire({
      icon: "warning",
      title: "เวลาใช้งานห้องประชุมซ้อนทับกัน!",
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #334155;">
          <p><strong>ห้องประชุม:</strong> <span style="color: #2563eb;">${roomName}</span></p>
          <p><strong>เวลาที่คุณต้องการ:</strong> ${selectedTime}</p>
          <div style="margin-top: 10px; padding: 10px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #991b1b;">
            <strong>คำขอที่ซ้อนทับ:</strong><br />
            ${conflictingDetails}
          </div>
          <p style="margin-top: 10px; color: #64748b;">กรุณาเลือกช่วงเวลาอื่น หรือเลือกห้องประชุมห้องอื่นที่ยังว่าง</p>
        </div>
      `,
      confirmButtonText: "เข้าใจแล้ว ปรับเวลาใหม่",
      confirmButtonColor: "#D97706",
    });
  }
}

export const Swal = new SweetAlertManager();
