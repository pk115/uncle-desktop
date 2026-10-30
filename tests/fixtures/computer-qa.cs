using System;
using System.Windows.Forms;
using System.Runtime.InteropServices;
public class UncleQa {
 [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h,int n);
 [STAThread] public static void Main(string[] args) {
  var form=new Form{Text="Uncle Computer QA",Width=600,Height=440,TopMost=true};
  var field=new TextBox{AccessibleName="Uncle QA editor",Multiline=true};field.SetBounds(20,20,540,160);
  var button=new Button{Text="ทดสอบ"};button.SetBounds(20,200,120,40);
  var label=new Label{Text="ยังไม่คลิก"};label.SetBounds(160,210,200,30);button.Click+=(s,e)=>label.Text="คลิกสำเร็จ";
  var secret=new TextBox{AccessibleName="QA password",UseSystemPasswordChar=true,Text="DO_NOT_EXPOSE"};secret.SetBounds(20,255,240,25);
  var slider=new TrackBar{AccessibleName="Uncle QA slider",Minimum=0,Maximum=100};slider.SetBounds(20,300,500,50);
  var sliderValue=new Label{Text="Slider:0"};sliderValue.SetBounds(20,355,250,25);slider.ValueChanged+=(s,e)=>sliderValue.Text="Slider:"+slider.Value;
  form.Controls.AddRange(new Control[]{field,button,label,slider,sliderValue});
  if(Array.IndexOf(args,"--visual")<0)form.Controls.Add(secret);
  else {var canvas=new Panel();canvas.SetBounds(380,200,140,80);bool done=false;canvas.Paint+=(s,e)=>{e.Graphics.FillEllipse(done?System.Drawing.Brushes.LimeGreen:System.Drawing.Brushes.MediumPurple,30,5,60,60);};canvas.MouseClick+=(s,e)=>{done=true;canvas.Invalidate();};form.Controls.Add(canvas);}
  var timer=new Timer{Interval=300};timer.Tick+=(s,e)=>{ShowWindow(form.Handle,5);form.Activate();field.Focus();timer.Stop();};timer.Start();Application.Run(form);
 }
}
