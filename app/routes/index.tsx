import Features from "~/components/landing/features";
import Footer from "~/components/landing/footer";
import Header from "~/components/landing/header";
import Partners from "~/components/landing/partners";
import Preview from "~/components/landing/preview";
import Tools from "~/components/landing/tools";
import UseCases from "~/components/landing/useCases";

export default function Index() {
  return (
    <>
      <div className="h-screen min-h-screen">
        <Header />
        <Preview />
      </div>
      <div className="h-screen min-h-screen">
        <Features />
      </div>
      <div className="h-screen min-h-screen">
        <Tools />
      </div>
      <div className="h-screen min-h-screen">
        <UseCases />
      </div>
      <div className="h-screen min-h-screen">
        <Partners />
        <Footer />
      </div>
    </>
  );
}
